import {error} from '../errors'
import * as Globby from 'globby'
import * as path from 'path'
import {inspect} from 'util'

import {Plugin as IPlugin, PluginOptions} from '../interfaces/plugin'
import {Command} from '../interfaces/command'
import {toCached} from './config'
import {Debug} from './util'
import {Manifest} from '../interfaces/manifest'
import {PJSON} from '../interfaces/pjson'
import {Topic} from '../interfaces/topic'
import {tsPath} from './ts-node'
import {compact, exists, resolvePackage, flatMap, loadJSON, mapValues} from './util'
import {isProd} from '../util'
import ModuleLoader from '../module-loader'

const _pjson = require('../../package.json')

function topicsToArray(input: any, base?: string): Topic[] {
  if (!input) return []
  base = base ? `${base}:` : ''
  if (Array.isArray(input)) {
    return input.concat(flatMap(input, t => topicsToArray(t.subtopics, `${base}${t.name}`)))
  }

  return flatMap(Object.keys(input), k => {
    input[k].name = k
    return [{...input[k], name: `${base}${k}`}].concat(topicsToArray(input[k].subtopics, `${base}${input[k].name}`))
  })
}

// essentially just "cd .."
function * up(from: string) {
  while (path.dirname(from) !== from) {
    yield from
    from = path.dirname(from)
  }

  yield from
}

async function findSourcesRoot(root: string) {
  for (const next of up(root)) {
    const cur = path.join(next, 'package.json')
    // eslint-disable-next-line no-await-in-loop
    if (await exists(cur)) return path.dirname(cur)
  }
}

/**
 * @returns string
 * @param name string
 * @param root string
 * find package root
 * for packages installed into node_modules this will go up directories until
 * it finds a node_modules directory with the plugin installed into it
 *
 * This is needed because some oclif plugins do not declare the `main` field in their package.json
 * https://github.com/oclif/config/pull/289#issuecomment-983904051
 */
async function findRootLegacy(name: string | undefined, root: string): Promise<string | undefined> {
  for (const next of up(root)) {
    let cur
    if (name) {
      cur = path.join(next, 'node_modules', name, 'package.json')
      // eslint-disable-next-line no-await-in-loop
      if (await exists(cur)) return path.dirname(cur)
      try {
        // eslint-disable-next-line no-await-in-loop
        const pkg = await loadJSON(path.join(next, 'package.json'))
        if (pkg.name === name) return next
      } catch {}
    } else {
      cur = path.join(next, 'package.json')
      // eslint-disable-next-line no-await-in-loop
      if (await exists(cur)) return path.dirname(cur)
    }
  }
}

async function findRoot(name: string | undefined, root: string) {
  if (name) {
    let pkgPath
    try {
      pkgPath = resolvePackage(name, {paths: [root]})
    } catch {}

    return pkgPath ? findSourcesRoot(path.dirname(pkgPath)) : findRootLegacy(name, root)
  }

  return findSourcesRoot(root)
}

export class Plugin implements IPlugin {
  // static loadedPlugins: {[name: string]: Plugin} = {}
  _base = `${_pjson.name}@${_pjson.version}`

  name!: string

  version!: string

  pjson!: PJSON.Plugin

  type!: string

  root!: string

  alias!: string

  tag?: string

  manifest!: Manifest

  commands!: Command.Plugin[]

  hooks!: {[k: string]: string[]}

  valid = false

  alreadyLoaded = false

  parent: Plugin | undefined

  children: Plugin[] = []

  // eslint-disable-next-line new-cap
  protected _debug = Debug()

  protected warned = false

  // eslint-disable-next-line no-useless-constructor
  constructor(public options: PluginOptions) {}

  async load() {
    this.type = this.options.type || 'core'
    this.tag = this.options.tag
    const root = await findRoot(this.options.name, this.options.root)
    if (!root) throw new Error(`could not find package.json with ${inspect(this.options)}`)
    this.root = root
    this._debug('reading %s plugin %s', this.type, root)
    this.pjson = await loadJSON(path.join(root, 'package.json')) as any
    this.name = this.pjson.name
    this.alias = this.options.name ?? this.pjson.name
    const pjsonPath = path.join(root, 'package.json')
    if (!this.name) throw new Error(`no name in ${pjsonPath}`)
    if (!isProd() && !this.pjson.files) this.warn(`files attribute must be specified in ${pjsonPath}`)
    // eslint-disable-next-line new-cap
    this._debug = Debug(this.name)
    this.version = this.pjson.version
    if (this.pjson.oclif) {
      this.valid = true
    } else {
      this.pjson.oclif = this.pjson['cli-engine'] || {}
    }

    this.hooks = mapValues(this.pjson.oclif.hooks || {}, i => Array.isArray(i) ? i : [i])

    this.manifest = await this._manifest(Boolean(this.options.ignoreManifest), Boolean(this.options.errorOnManifestCreate))
    this.commands = Object
    .entries(this.manifest.commands)
    .map(([id, c]) => ({...c, pluginAlias: this.alias, pluginType: this.type, load: async () => this.findCommand(id, {must: true})}))
    .sort((a, b) => a.id.localeCompare(b.id))
  }

  get topics(): Topic[] {
    return topicsToArray(this.pjson.oclif.topics || {})
  }

  get commandsDir() {
    return tsPath(this.root, this.pjson.oclif.commands)
  }

  get commandIDs() {
    if (!this.commandsDir) return []
    let globby: typeof Globby
    try {
      const globbyPath = require.resolve('globby', {paths: [this.root, __dirname]})
      globby = require(globbyPath)
    } catch (error: any) {
      this.warn(error, 'not loading commands, globby not found')
      return []
    }

    this._debug(`loading IDs from ${this.commandsDir}`)
    const patterns = [
      '**/*.+(js|cjs|mjs|ts|tsx)',
      '!**/*.+(d.ts|test.ts|test.js|spec.ts|spec.js)?(x)',
    ]
    const ids = globby.sync(patterns, {cwd: this.commandsDir})
    .map(file => {
      const p = path.parse(file)
      const topics = p.dir.split('/')
      const command = p.name !== 'index' && p.name
      return [...topics, command].filter(f => f).join(':')
    })
    this._debug('found commands', ids)
    return ids
  }

  async findCommand(id: string, opts: {must: true}): Promise<Command.Class>

  async findCommand(id: string, opts?: {must: boolean}): Promise<Command.Class | undefined>

  async findCommand(id: string, opts: {must?: boolean} = {}): Promise<Command.Class | undefined> {
    const fetch = async () => {
      if (!this.commandsDir) return
      const search = (cmd: any) => {
        if (typeof cmd.run === 'function') return cmd
        if (cmd.default && cmd.default.run) return cmd.default
        return Object.values(cmd).find((cmd: any) => typeof cmd.run === 'function')
      }

      let m
      try {
        const p = path.join(this.pjson.oclif.commands as string, ...id.split(':'))
        const {isESM, module, filePath} = await ModuleLoader.loadWithData(this, p)
        this._debug(isESM ? '(import)' : '(require)', filePath)
        m = module
      } catch (error: any) {
        if (!opts.must && error.code === 'MODULE_NOT_FOUND') return
        throw error
      }

      const cmd = search(m)
      if (!cmd) return
      cmd.id = id
      cmd.plugin = this
      return cmd
    }

    const cmd = await fetch()
    if (!cmd && opts.must) error(`command ${id} not found`)
    return cmd
  }

  protected async _manifest(ignoreManifest: boolean, errorOnManifestCreate = false): Promise<Manifest> {
    const readManifest = async (dotfile = false): Promise<Manifest | undefined> => {
      try {
        const p = path.join(this.root, `${dotfile ? '.' : ''}oclif.manifest.json`)
        const manifest: Manifest = await loadJSON(p)
        if (!process.env.OCLIF_NEXT_VERSION && manifest.version.split('-')[0] !== this.version.split('-')[0]) {
          process.emitWarning(`Mismatched version in ${this.name} plugin manifest. Expected: ${this.version} Received: ${manifest.version}\nThis usually means you have an oclif.manifest.json file that should be deleted in development. This file should be automatically generated when publishing.`)
        } else {
          this._debug('using manifest from', p)
          return manifest
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          if (!dotfile) return readManifest(true)
        } else {
          this.warn(error, 'readManifest')
        }
      }
    }

    if (!ignoreManifest) {
      const manifest = await readManifest()
      if (manifest) return manifest
    }

    return {
      version: this.version,
      commands: (await Promise.all(this.commandIDs.map(async id => {
        try {
          return [id, await toCached(await this.findCommand(id, {must: true}), this)]
        } catch (error: any) {
          const scope = 'toCached'
          if (Boolean(errorOnManifestCreate) === false) this.warn(error, scope)
          else throw this.addErrorScope(error, scope)
        }
      })))
      .filter((f): f is [string, Command] => Boolean(f))
      .reduce((commands, [id, c]) => {
        commands[id] = c
        return commands
      }, {} as {[k: string]: Command}),
    }
  }

  protected warn(err: any, scope?: string) {
    if (this.warned) return
    if (typeof err === 'string') err = new Error(err)
    process.emitWarning(this.addErrorScope(err, scope))
  }

  private addErrorScope(err: any, scope?: string) {
    err.name = `${err.name} Plugin: ${this.name}`
    err.detail = compact([err.detail, `module: ${this._base}`, scope && `task: ${scope}`, `plugin: ${this.name}`, `root: ${this.root}`, 'See more details with DEBUG=*']).join('\n')
    return err
  }
}

