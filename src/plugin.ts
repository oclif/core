import {error} from '@oclif/errors'
import * as Globby from 'globby'
import * as path from 'path'
import {inspect} from 'util'

import {Command} from './command'
import Debug from './debug'
import {Manifest} from './manifest'
import {PJSON} from './pjson'
import {Topic} from './topic'
import {tsPath} from './ts-node'
import {compact, exists, flatMap, loadJSON, mapValues} from './util'

export interface Options {
  root: string;
  name?: string;
  type?: string;
  tag?: string;
  ignoreManifest?: boolean;
  errorOnManifestCreate?: boolean;
  parent?: Plugin;
  children?: Plugin[];
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IPlugin {
  /**
   * @oclif/config version
   */
  _base: string;
  /**
   * name from package.json
   */
  name: string;
  /**
   * version from package.json
   *
   * example: 1.2.3
   */
  version: string;
  /**
   * full package.json
   *
   * parsed with read-pkg
   */
  pjson: PJSON.Plugin | PJSON.CLI;
  /**
   * used to tell the user how the plugin was installed
   * examples: core, link, user, dev
   */
  type: string;
  /**
   * base path of plugin
   */
  root: string;
  /**
   * npm dist-tag of plugin
   * only used for user plugins
   */
  tag?: string;
  /**
   * if it appears to be an npm package but does not look like it's really a CLI plugin, this is set to false
   */
  valid: boolean;

  commands: Command.Plugin[];
  hooks: {[k: string]: string[]};
  readonly commandIDs: string[];
  readonly topics: Topic[];

  findCommand(id: string, opts: {must: true}): Command.Class;
  findCommand(id: string, opts?: {must: boolean}): Command.Class | undefined;
  load(): Promise<void>;
}

const _pjson = require('../package.json')

const hasManifest = function (p: string): boolean {
  try {
    require(p)
    return true
  } catch {
    return false
  }
}

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

// eslint-disable-next-line valid-jsdoc
/**
 * find package root
 * for packages installed into node_modules this will go up directories until
 * it finds a node_modules directory with the plugin installed into it
 *
 * This is needed because of the deduping npm does
 */
async function findRoot(name: string | undefined, root: string) {
  // essentially just "cd .."
  function * up(from: string) {
    while (path.dirname(from) !== from) {
      yield from
      from = path.dirname(from)
    }
    yield from
  }
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
      } catch { }
    } else {
      cur = path.join(next, 'package.json')
      // eslint-disable-next-line no-await-in-loop
      if (await exists(cur)) return path.dirname(cur)
    }
  }
}

export class Plugin implements IPlugin {
  // static loadedPlugins: {[name: string]: Plugin} = {}
  _base = `${_pjson.name}@${_pjson.version}`

  name!: string

  version!: string

  pjson!: PJSON.Plugin

  type!: string

  root!: string

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
  constructor(public options: Options) {}

  async load() {
    this.type = this.options.type || 'core'
    this.tag = this.options.tag
    const root = await findRoot(this.options.name, this.options.root)
    if (!root) throw new Error(`could not find package.json with ${inspect(this.options)}`)
    this.root = root
    this._debug('reading %s plugin %s', this.type, root)
    this.pjson = await loadJSON(path.join(root, 'package.json')) as any
    this.name = this.pjson.name
    const pjsonPath = path.join(root, 'package.json')
    if (!this.name) throw new Error(`no name in ${pjsonPath}`)
    const isProd = hasManifest(path.join(root, 'oclif.manifest.json'))
    if (!isProd && !this.pjson.files) this.warn(`files attribute must be specified in ${pjsonPath}`)
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
    this.commands = Object.entries(this.manifest.commands)
    .map(([id, c]) => ({...c, load: () => this.findCommand(id, {must: true})}))
    this.commands.sort((a, b) => {
      if (a.id < b.id) return -1
      if (a.id > b.id) return 1
      return 0
    })
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
    } catch (error) {
      this.warn(error, 'not loading commands, globby not found')
      return []
    }
    this._debug(`loading IDs from ${this.commandsDir}`)
    const patterns = [
      '**/*.+(js|ts|tsx)',
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

  findCommand(id: string, opts: {must: true}): Command.Class

  findCommand(id: string, opts?: {must: boolean}): Command.Class | undefined

  findCommand(id: string, opts: {must?: boolean} = {}): Command.Class | undefined {
    const fetch = () => {
      if (!this.commandsDir) return
      const search = (cmd: any) => {
        if (typeof cmd.run === 'function') return cmd
        if (cmd.default && cmd.default.run) return cmd.default
        return Object.values(cmd).find((cmd: any) => typeof cmd.run === 'function')
      }
      const p = require.resolve(path.join(this.commandsDir, ...id.split(':')))
      this._debug('require', p)
      let m
      try {
        m = require(p)
      } catch (error) {
        if (!opts.must && error.code === 'MODULE_NOT_FOUND') return
        throw error
      }
      const cmd = search(m)
      if (!cmd) return
      cmd.id = id
      cmd.plugin = this
      return cmd
    }
    const cmd = fetch()
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
      } catch (error) {
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
      // eslint-disable-next-line array-callback-return
      commands: this.commandIDs.map(id => {
        try {
          return [id, Command.toCached(this.findCommand(id, {must: true}), this)]
        } catch (error) {
          const scope = 'toCached'
          if (Boolean(errorOnManifestCreate) === false) this.warn(error, scope)
          else throw this.addErrorScope(error, scope)
        }
      })
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

