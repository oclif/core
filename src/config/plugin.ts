import globby from 'globby'
import {join, parse, relative, sep} from 'node:path'
import {inspect} from 'node:util'

import {Command} from '../command'
import {CLIError, error} from '../errors'
import {Manifest} from '../interfaces/manifest'
import {PJSON} from '../interfaces/pjson'
import {Plugin as IPlugin, PluginOptions} from '../interfaces/plugin'
import {Topic} from '../interfaces/topic'
import {loadWithData, loadWithDataFromManifest} from '../module-loader'
import {OCLIF_MARKER_OWNER, Performance} from '../performance'
import {cacheCommand} from '../util/cache-command'
import {findRoot} from '../util/find-root'
import {readJson, requireJson} from '../util/fs'
import {castArray, compact} from '../util/util'
import {tsPath} from './ts-node'
import {Debug, getCommandIdPermutations} from './util'

const _pjson = requireJson<PJSON>(__dirname, '..', '..', 'package.json')

function topicsToArray(input: any, base?: string): Topic[] {
  if (!input) return []
  base = base ? `${base}:` : ''
  if (Array.isArray(input)) {
    return [...input, input.flatMap((t) => topicsToArray(t.subtopics, `${base}${t.name}`))]
  }

  return Object.keys(input).flatMap((k) => {
    input[k].name = k
    return [{...input[k], name: `${base}${k}`}, ...topicsToArray(input[k].subtopics, `${base}${input[k].name}`)]
  })
}

const cachedCommandCanBeUsed = (manifest: Manifest | undefined, id: string): boolean =>
  Boolean(manifest?.commands[id] && 'isESM' in manifest.commands[id] && 'relativePath' in manifest.commands[id])

const search = (cmd: any) => {
  if (typeof cmd.run === 'function') return cmd
  if (cmd.default && cmd.default.run) return cmd.default
  return Object.values(cmd).find((cmd: any) => typeof cmd.run === 'function')
}

const GLOB_PATTERNS = [
  '**/*.+(js|cjs|mjs|ts|tsx|mts|cts)',
  '!**/*.+(d.ts|test.ts|test.js|spec.ts|spec.js|d.mts|d.cts)?(x)',
]

function processCommandIds(files: string[]): string[] {
  return files.map((file) => {
    const p = parse(file)
    const topics = p.dir.split('/')
    const command = p.name !== 'index' && p.name
    const id = [...topics, command].filter(Boolean).join(':')
    return id === '' ? '.' : id
  })
}

export class Plugin implements IPlugin {
  alias!: string

  alreadyLoaded = false

  children: Plugin[] = []

  commandIDs: string[] = []

  // This will be initialized in the _manifest() method, which gets called in the load() method.
  commands!: Command.Loadable[]

  commandsDir: string | undefined

  hasManifest = false

  hooks!: {[k: string]: string[]}

  isRoot = false

  manifest!: Manifest

  moduleType!: 'commonjs' | 'module'

  name!: string

  parent: Plugin | undefined

  pjson!: PJSON.Plugin

  root!: string

  tag?: string

  type!: string

  valid = false

  version!: string

  protected warned = false

  _base = `${_pjson.name}@${_pjson.version}`

  // eslint-disable-next-line new-cap
  protected _debug = Debug()

  private flexibleTaxonomy!: boolean

  constructor(public options: PluginOptions) {}

  public get topics(): Topic[] {
    return topicsToArray(this.pjson.oclif.topics || {})
  }

  public async findCommand(id: string, opts: {must: true}): Promise<Command.Class>

  public async findCommand(id: string, opts?: {must: boolean}): Promise<Command.Class | undefined>

  public async findCommand(id: string, opts: {must?: boolean} = {}): Promise<Command.Class | undefined> {
    const marker = Performance.mark(OCLIF_MARKER_OWNER, `plugin.findCommand#${this.name}.${id}`, {
      id,
      plugin: this.name,
    })

    const fetch = async () => {
      const commandsDir = await this.getCommandsDir()
      if (!commandsDir) return
      let module
      let isESM: boolean | undefined
      let filePath: string | undefined
      try {
        ;({filePath, isESM, module} = cachedCommandCanBeUsed(this.manifest, id)
          ? await loadWithDataFromManifest(this.manifest.commands[id], this.root)
          : await loadWithData(this, join(commandsDir ?? this.pjson.oclif.commands, ...id.split(':'))))
        this._debug(isESM ? '(import)' : '(require)', filePath)
      } catch (error: any) {
        if (!opts.must && error.code === 'MODULE_NOT_FOUND') return
        throw error
      }

      const cmd = search(module)
      if (!cmd) return
      cmd.id = id
      cmd.plugin = this
      cmd.isESM = isESM
      cmd.relativePath = relative(this.root, filePath || '').split(sep)
      return cmd
    }

    const cmd = await fetch()
    if (!cmd && opts.must) error(`command ${id} not found`)
    marker?.stop()
    return cmd
  }

  public async load(): Promise<void> {
    this.type = this.options.type ?? 'core'
    this.tag = this.options.tag
    this.isRoot = this.options.isRoot ?? false
    if (this.options.parent) this.parent = this.options.parent as Plugin
    // Linked plugins already have a root so there's no need to search for it.
    // However there could be child plugins nested inside the linked plugin, in which
    // case we still need to search for the child plugin's root.
    const root =
      this.type === 'link' && !this.parent ? this.options.root : await findRoot(this.options.name, this.options.root)
    if (!root) throw new CLIError(`could not find package.json with ${inspect(this.options)}`)
    this.root = root
    this._debug(`loading ${this.type} plugin from ${root}`)
    this.pjson = await readJson(join(root, 'package.json'))
    this.flexibleTaxonomy = this.options?.flexibleTaxonomy || this.pjson.oclif?.flexibleTaxonomy || false
    this.moduleType = this.pjson.type === 'module' ? 'module' : 'commonjs'
    this.name = this.pjson.name
    this.alias = this.options.name ?? this.pjson.name
    const pjsonPath = join(root, 'package.json')
    if (!this.name) throw new CLIError(`no name in ${pjsonPath}`)
    // eslint-disable-next-line new-cap
    this._debug = Debug(this.name)
    this.version = this.pjson.version
    if (this.pjson.oclif) {
      this.valid = true
    } else {
      this.pjson.oclif = this.pjson['cli-engine'] || {}
    }

    this.hooks = Object.fromEntries(Object.entries(this.pjson.oclif.hooks ?? {}).map(([k, v]) => [k, castArray(v)]))

    this.manifest = await this._manifest()
    this.commands = Object.entries(this.manifest.commands)
      .map(([id, c]) => ({
        ...c,
        load: async () => this.findCommand(id, {must: true}),
        pluginAlias: this.alias,
        pluginType: c.pluginType === 'jit' ? 'jit' : this.type,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  private async _manifest(): Promise<Manifest> {
    const ignoreManifest = Boolean(this.options.ignoreManifest)
    const errorOnManifestCreate = Boolean(this.options.errorOnManifestCreate)
    const respectNoCacheDefault = Boolean(this.options.respectNoCacheDefault)

    const readManifest = async (dotfile = false): Promise<Manifest | undefined> => {
      try {
        const p = join(this.root, `${dotfile ? '.' : ''}oclif.manifest.json`)
        const manifest = await readJson<Manifest>(p)
        if (!process.env.OCLIF_NEXT_VERSION && manifest.version.split('-')[0] !== this.version.split('-')[0]) {
          process.emitWarning(
            `Mismatched version in ${this.name} plugin manifest. Expected: ${this.version} Received: ${manifest.version}\nThis usually means you have an oclif.manifest.json file that should be deleted in development. This file should be automatically generated when publishing.`,
          )
        } else {
          this._debug('using manifest from', p)
          this.hasManifest = true
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

    const marker = Performance.mark(OCLIF_MARKER_OWNER, `plugin.manifest#${this.name}`, {plugin: this.name})
    if (!ignoreManifest) {
      const manifest = await readManifest()
      if (manifest) {
        marker?.addDetails({commandCount: Object.keys(manifest.commands).length, fromCache: true})
        marker?.stop()
        this.commandIDs = Object.keys(manifest.commands)
        return manifest
      }
    }

    this.commandIDs = await this.getCommandIDs()
    const manifest = {
      commands: (
        await Promise.all(
          this.commandIDs.map(async (id) => {
            try {
              const cached = await cacheCommand(await this.findCommand(id, {must: true}), this, respectNoCacheDefault)
              if (this.flexibleTaxonomy) {
                const permutations = getCommandIdPermutations(id)
                const aliasPermutations = cached.aliases.flatMap((a) => getCommandIdPermutations(a))
                return [id, {...cached, aliasPermutations, permutations} as Command.Cached]
              }

              return [id, cached]
            } catch (error: any) {
              const scope = 'cacheCommand'
              if (Boolean(errorOnManifestCreate) === false) this.warn(error, scope)
              else throw this.addErrorScope(error, scope)
            }
          }),
        )
      )
        // eslint-disable-next-line unicorn/no-await-expression-member, unicorn/prefer-native-coercion-functions
        .filter((f): f is [string, Command.Cached] => Boolean(f))
        .reduce(
          (commands, [id, c]) => {
            commands[id] = c
            return commands
          },
          {} as {[k: string]: Command.Cached},
        ),
      version: this.version,
    }
    marker?.addDetails({commandCount: Object.keys(manifest.commands).length, fromCache: false})
    marker?.stop()
    return manifest
  }

  private addErrorScope(err: any, scope?: string) {
    err.name = `${err.name} Plugin: ${this.name}`
    err.detail = compact([
      err.detail,
      `module: ${this._base}`,
      scope && `task: ${scope}`,
      `plugin: ${this.name}`,
      `root: ${this.root}`,
      'See more details with DEBUG=*',
    ]).join('\n')
    return err
  }

  private async getCommandIDs(): Promise<string[]> {
    const commandsDir = await this.getCommandsDir()
    if (!commandsDir) return []

    const marker = Performance.mark(OCLIF_MARKER_OWNER, `plugin.getCommandIDs#${this.name}`, {plugin: this.name})
    this._debug(`loading IDs from ${commandsDir}`)
    const files = await globby(GLOB_PATTERNS, {cwd: commandsDir})
    const ids = processCommandIds(files)
    this._debug('found commands', ids)
    marker?.addDetails({count: ids.length})
    marker?.stop()
    return ids
  }

  private async getCommandsDir(): Promise<string | undefined> {
    if (this.commandsDir) return this.commandsDir
    this.commandsDir = await tsPath(this.root, this.pjson.oclif.commands, this)
    return this.commandsDir
  }

  private warn(err: CLIError | Error | string, scope?: string): void {
    if (this.warned) return
    if (typeof err === 'string') err = new Error(err)
    process.emitWarning(this.addErrorScope(err, scope))
  }
}
