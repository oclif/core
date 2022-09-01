import {CLIError, error, exit, warn} from '../errors'
import * as ejs from 'ejs'
import * as os from 'os'
import * as path from 'path'
import {fileURLToPath, URL} from 'url'
import {format} from 'util'

import {Options, Plugin as IPlugin} from '../interfaces/plugin'
import {Config as IConfig, ArchTypes, PlatformTypes, LoadOptions} from '../interfaces/config'
import {Command, CompletableOptionFlag, Hook, Hooks, PJSON, Topic} from '../interfaces'
import * as Plugin from './plugin'
import {Debug, compact, loadJSON, collectUsableIds, getCommandIdPermutations} from './util'
import {isProd} from '../util'
import ModuleLoader from '../module-loader'
import {getHelpFlagAdditions} from '../help/util'

// eslint-disable-next-line new-cap
const debug = Debug()

const _pjson = require('../../package.json')

function channelFromVersion(version: string) {
  const m = version.match(/[^-]+(?:-([^.]+))?/)
  return (m && m[1]) || 'stable'
}

function hasManifest(p: string): boolean {
  try {
    require(p)
    return true
  } catch {
    return false
  }
}

const WSL = require('is-wsl')

function isConfig(o: any): o is IConfig {
  return o && Boolean(o._base)
}

class Permutations extends Map<string, Set<string>> {
  private validPermutations = new Map<string, string>()

  public add(permutation: string, commandId: string): void {
    this.validPermutations.set(permutation, commandId)
    for (const id of collectUsableIds([permutation])) {
      if (this.has(id)) {
        this.set(id, this.get(id).add(commandId))
      } else {
        this.set(id, new Set([commandId]))
      }
    }
  }

  public get(key: string): Set<string> {
    return super.get(key) ?? new Set()
  }

  public getValid(key: string): string | undefined {
    return this.validPermutations.get(key)
  }

  public getAllValid(): string[] {
    return [...this.validPermutations.keys()]
  }

  public hasValid(key: string): boolean {
    return this.validPermutations.has(key)
  }
}

export class Config implements IConfig {
  _base = `${_pjson.name}@${_pjson.version}`

  name!: string

  version!: string

  channel!: string

  root!: string

  arch!: ArchTypes

  bin!: string

  cacheDir!: string

  configDir!: string

  dataDir!: string

  dirname!: string

  errlog!: string

  home!: string

  platform!: PlatformTypes

  shell!: string

  windows!: boolean

  userAgent!: string

  debug = 0

  npmRegistry?: string

  pjson!: PJSON.CLI

  userPJSON?: PJSON.User

  plugins: IPlugin[] = []

  binPath?: string

  valid!: boolean

  topicSeparator: ':' | ' ' = ':'

  flexibleTaxonomy!: boolean

  protected warned = false

  private commandPermutations = new Permutations()

  private topicPermutations = new Permutations()

  private _commands = new Map<string, Command.Loadable>()

  private _topics = new Map<string, Topic>()

  private _commandIDs!: string[]

  // eslint-disable-next-line no-useless-constructor
  constructor(public options: Options) {}

  static async load(opts: LoadOptions = (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname) {
    // Handle the case when a file URL string is passed in such as 'import.meta.url'; covert to file path.
    if (typeof opts === 'string' && opts.startsWith('file://')) {
      opts = fileURLToPath(opts)
    }

    if (typeof opts === 'string') opts = {root: opts}
    if (isConfig(opts)) return opts
    const config = new Config(opts)
    await config.load()
    return config
  }

  // eslint-disable-next-line complexity
  async load() {
    const plugin = new Plugin.Plugin({root: this.options.root})
    await plugin.load()
    this.plugins.push(plugin)
    this.root = plugin.root
    this.pjson = plugin.pjson
    this.name = this.pjson.name
    this.version = this.options.version || this.pjson.version || '0.0.0'
    this.channel = this.options.channel || channelFromVersion(this.version)
    this.valid = plugin.valid

    this.arch = (os.arch() === 'ia32' ? 'x86' : os.arch() as any)
    this.platform = WSL ? 'wsl' : os.platform() as any
    this.windows = this.platform === 'win32'
    this.bin = this.pjson.oclif.bin || this.name
    this.dirname = this.pjson.oclif.dirname || this.name
    this.flexibleTaxonomy = this.pjson.oclif.flexibleTaxonomy || false
    // currently, only colons or spaces are valid separators
    if (this.pjson.oclif.topicSeparator && [':', ' '].includes(this.pjson.oclif.topicSeparator)) this.topicSeparator = this.pjson.oclif.topicSeparator!
    if (this.platform === 'win32') this.dirname = this.dirname.replace('/', '\\')
    this.userAgent = `${this.name}/${this.version} ${this.platform}-${this.arch} node-${process.version}`
    this.shell = this._shell()
    this.debug = this._debug()

    this.home = process.env.HOME || (this.windows && this.windowsHome()) || os.homedir() || os.tmpdir()
    this.cacheDir = this.scopedEnvVar('CACHE_DIR') || this.macosCacheDir() || this.dir('cache')
    this.configDir = this.scopedEnvVar('CONFIG_DIR') || this.dir('config')
    this.dataDir = this.scopedEnvVar('DATA_DIR') || this.dir('data')
    this.errlog = path.join(this.cacheDir, 'error.log')
    this.binPath = this.scopedEnvVar('BINPATH')

    this.npmRegistry = this.scopedEnvVar('NPM_REGISTRY') || this.pjson.oclif.npmRegistry

    this.pjson.oclif.update = this.pjson.oclif.update || {}
    this.pjson.oclif.update.node = this.pjson.oclif.update.node || {}
    const s3 = this.pjson.oclif.update.s3 || {}
    this.pjson.oclif.update.s3 = s3
    s3.bucket = this.scopedEnvVar('S3_BUCKET') || s3.bucket
    if (s3.bucket && !s3.host) s3.host = `https://${s3.bucket}.s3.amazonaws.com`
    s3.templates = {
      ...s3.templates,
      target: {
        baseDir: '<%- bin %>',
        unversioned: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %><%- bin %>-<%- platform %>-<%- arch %><%- ext %>",
        versioned: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %><%- bin %>-v<%- version %>/<%- bin %>-v<%- version %>-<%- platform %>-<%- arch %><%- ext %>",
        manifest: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %><%- platform %>-<%- arch %>",
        ...s3.templates && s3.templates.target,
      },
      vanilla: {
        unversioned: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %><%- bin %><%- ext %>",
        versioned: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %><%- bin %>-v<%- version %>/<%- bin %>-v<%- version %><%- ext %>",
        baseDir: '<%- bin %>',
        manifest: "<%- channel === 'stable' ? '' : 'channels/' + channel + '/' %>version",
        ...s3.templates && s3.templates.vanilla,
      },
    }

    await this.loadUserPlugins()
    await this.loadDevPlugins()
    await this.loadCorePlugins()

    for (const plugin of this.plugins) {
      this.loadCommands(plugin)
      this.loadTopics(plugin)
    }

    debug('config done')
  }

  async loadCorePlugins() {
    if (this.pjson.oclif.plugins) {
      await this.loadPlugins(this.root, 'core', this.pjson.oclif.plugins)
    }
  }

  async loadDevPlugins() {
    if (this.options.devPlugins !== false) {
      // do not load oclif.devPlugins in production
      if (hasManifest(path.join(this.root, 'oclif.manifest.json'))) return
      try {
        const devPlugins = this.pjson.oclif.devPlugins
        if (devPlugins) await this.loadPlugins(this.root, 'dev', devPlugins)
      } catch (error: any) {
        process.emitWarning(error)
      }
    }
  }

  async loadUserPlugins() {
    if (this.options.userPlugins !== false) {
      try {
        const userPJSONPath = path.join(this.dataDir, 'package.json')
        debug('reading user plugins pjson %s', userPJSONPath)
        const pjson = await loadJSON(userPJSONPath)
        this.userPJSON = pjson
        if (!pjson.oclif) pjson.oclif = {schema: 1}
        if (!pjson.oclif.plugins) pjson.oclif.plugins = []
        await this.loadPlugins(userPJSONPath, 'user', pjson.oclif.plugins.filter((p: any) => p.type === 'user'))
        await this.loadPlugins(userPJSONPath, 'link', pjson.oclif.plugins.filter((p: any) => p.type === 'link'))
      } catch (error: any) {
        if (error.code !== 'ENOENT') process.emitWarning(error)
      }
    }
  }

  async runHook<T extends keyof Hooks>(event: T, opts: Hooks[T]['options'], timeout?: number): Promise<Hook.Result<Hooks[T]['return']>> {
    debug('start %s hook', event)
    const search = (m: any): Hook<T> => {
      if (typeof m === 'function') return m
      if (m.default && typeof m.default === 'function') return m.default
      return Object.values(m).find((m: any) => typeof m === 'function') as Hook<T>
    }

    const withTimeout = async (ms: number, promise: any) => {
      let id: NodeJS.Timeout
      const timeout = new Promise((_, reject) => {
        id = setTimeout(() => {
          reject(new Error(`Timed out after ${ms} ms.`))
        }, ms).unref()
      })

      return Promise.race([promise, timeout]).then(result => {
        clearTimeout(id)
        return result
      })
    }

    const final = {
      successes: [],
      failures: [],
    } as Hook.Result<Hooks[T]['return']>
    const promises = this.plugins.map(async p => {
      const debug = require('debug')([this.bin, p.name, 'hooks', event].join(':'))
      const context: Hook.Context = {
        config: this,
        debug,
        exit(code = 0) {
          exit(code)
        },
        log(message?: any, ...args: any[]) {
          process.stdout.write(format(message, ...args) + '\n')
        },
        error(message, options: { code?: string; exit?: number } = {}) {
          error(message, options)
        },
        warn(message: string) {
          warn(message)
        },
      }

      const hooks = p.hooks[event] || []

      for (const hook of hooks) {
        try {
          /* eslint-disable no-await-in-loop */
          const {isESM, module, filePath} = await ModuleLoader.loadWithData(p, hook)

          debug('start', isESM ? '(import)' : '(require)', filePath)

          const result = timeout ?
            await withTimeout(timeout, search(module).call(context, {...opts as any, config: this})) :
            await search(module).call(context, {...opts as any, config: this})
          final.successes.push({plugin: p, result})

          debug('done')
        } catch (error: any) {
          final.failures.push({plugin: p, error: error as Error})
          debug(error)
        }
      }
    })

    await Promise.all(promises)

    debug('%s hook done', event)

    return final
  }

  // eslint-disable-next-line default-param-last
  async runCommand<T = unknown>(id: string, argv: string[] = [], cachedCommand?: Command.Loadable): Promise<T> {
    debug('runCommand %s %o', id, argv)
    const c = cachedCommand || this.findCommand(id)
    if (!c) {
      const matches = this.flexibleTaxonomy ? this.findMatches(id, argv) : []
      const hookResult = this.flexibleTaxonomy && matches.length > 0 ?
        await this.runHook('command_incomplete', {id, argv, matches}) :
        await this.runHook('command_not_found', {id, argv})

      if (hookResult.successes[0]) {
        const cmdResult = hookResult.successes[0].result
        return cmdResult as T
      }

      if (hookResult.failures[0]) {
        throw hookResult.failures[0].error
      }

      throw new CLIError(`command ${id} not found`)
    }

    const command = await c.load()
    await this.runHook('prerun', {Command: command, argv})
    const result = (await command.run(argv, this)) as T
    await this.runHook('postrun', {Command: command, result: result, argv})
    return result
  }

  scopedEnvVar(k: string) {
    return process.env[this.scopedEnvVarKey(k)]
  }

  scopedEnvVarTrue(k: string): boolean {
    const v = process.env[this.scopedEnvVarKey(k)]
    return v === '1' || v === 'true'
  }

  scopedEnvVarKey(k: string) {
    return [this.bin, k]
    .map(p => p.replace(/@/g, '').replace(/[/-]/g, '_'))
    .join('_')
    .toUpperCase()
  }

  findCommand(id: string, opts: { must: true }): Command.Loadable

  findCommand(id: string, opts?: { must: boolean }): Command.Loadable | undefined

  findCommand(id: string, opts: { must?: boolean } = {}): Command.Loadable | undefined {
    const lookupId = this.getCmdLookupId(id)
    const command = this._commands.get(lookupId)
    if (opts.must && !command) error(`command ${lookupId} not found`)
    return command
  }

  findTopic(id: string, opts: { must: true }): Topic

  findTopic(id: string, opts?: { must: boolean }): Topic | undefined

  findTopic(name: string, opts: { must?: boolean } = {}) {
    const lookupId = this.getTopicLookupId(name)
    const topic = this._topics.get(lookupId)
    if (topic) return topic
    if (opts.must) throw new Error(`topic ${name} not found`)
  }

  /**
   * Find all command ids that include the provided command id.
   *
   * For example, if the command ids are:
   * - foo:bar:baz
   * - one:two:three
   *
   * `bar` would return `foo:bar:baz`
   *
   * @param partialCmdId string
   * @param argv string[] process.argv containing the flags and arguments provided by the user
   * @returns string[]
   */
  findMatches(partialCmdId: string, argv: string[]): Command.Loadable[] {
    const flags = argv.filter(arg => !getHelpFlagAdditions(this).includes(arg) && arg.startsWith('-')).map(a => a.replace(/-/g, ''))
    const possibleMatches = [...this.commandPermutations.get(partialCmdId)].map(k => this._commands.get(k)!)

    const matches = possibleMatches.filter(command => {
      const cmdFlags = Object.entries(command.flags).flatMap(([flag, def]) => {
        return def.char ? [def.char, flag] : [flag]
      }) as string[]

      // A command is a match if the provided flags belong to the full command
      return flags.every(f => cmdFlags.includes(f))
    })

    return matches
  }

  /**
   * Returns an array of all commands. If flexible taxonomy is enabled then all permutations will be appended to the array.
   * @returns Command.Loadable[]
   */
  getAllCommands(): Command.Loadable[] {
    const commands = [...this._commands.values()]
    const validPermutations = [...this.commandPermutations.getAllValid()]
    for (const permutation of validPermutations) {
      if (!this._commands.has(permutation)) {
        const cmd = this._commands.get(this.getCmdLookupId(permutation))!
        commands.push({...cmd, id: permutation})
      }
    }

    return commands
  }

  /**
   * Returns an array of all command ids. If flexible taxonomy is enabled then all permutations will be appended to the array.
   * @returns string[]
   */
  getAllCommandIDs(): string[] {
    return this.getAllCommands().map(c => c.id)
  }

  get commands(): Command.Loadable[] {
    return [...this._commands.values()]
  }

  get commandIDs(): string[] {
    if (this._commandIDs) return this._commandIDs
    this._commandIDs = this.commands.map(c => c.id)
    return this._commandIDs
  }

  get topics(): Topic[] {
    return [...this._topics.values()]
  }

  s3Key(type: keyof PJSON.S3.Templates, ext?: '.tar.gz' | '.tar.xz' | IConfig.s3Key.Options, options: IConfig.s3Key.Options = {}) {
    if (typeof ext === 'object') options = ext
    else if (ext) options.ext = ext
    const template = this.pjson.oclif.update.s3.templates[options.platform ? 'target' : 'vanilla'][type] ?? ''
    return ejs.render(template, {...this as any, ...options})
  }

  s3Url(key: string) {
    const host = this.pjson.oclif.update.s3.host
    if (!host) throw new Error('no s3 host is set')
    const url = new URL(host)
    url.pathname = path.join(url.pathname, key)
    return url.toString()
  }

  protected dir(category: 'cache' | 'data' | 'config'): string {
    const base = process.env[`XDG_${category.toUpperCase()}_HOME`] ||
      (this.windows && process.env.LOCALAPPDATA) ||
      path.join(this.home, category === 'data' ? '.local/share' : '.' + category)
    return path.join(base, this.dirname)
  }

  protected windowsHome() {
    return this.windowsHomedriveHome() || this.windowsUserprofileHome()
  }

  protected windowsHomedriveHome() {
    return (process.env.HOMEDRIVE && process.env.HOMEPATH && path.join(process.env.HOMEDRIVE!, process.env.HOMEPATH!))
  }

  protected windowsUserprofileHome() {
    return process.env.USERPROFILE
  }

  protected macosCacheDir(): string | undefined {
    return (this.platform === 'darwin' && path.join(this.home, 'Library', 'Caches', this.dirname)) || undefined
  }

  protected _shell(): string {
    let shellPath
    const {SHELL, COMSPEC} = process.env
    if (SHELL) {
      shellPath = SHELL.split('/')
    } else if (this.windows && COMSPEC) {
      shellPath = COMSPEC.split(/\\|\//)
    } else {
      shellPath = ['unknown']
    }

    return shellPath[shellPath.length - 1]
  }

  protected _debug(): number {
    if (this.scopedEnvVarTrue('DEBUG')) return 1
    try {
      const {enabled} = require('debug')(this.bin)
      if (enabled) return 1
    } catch {}

    return 0
  }

  protected async loadPlugins(root: string, type: string, plugins: (string | { root?: string; name?: string; tag?: string })[], parent?: Plugin.Plugin) {
    if (!plugins || plugins.length === 0) return
    debug('loading plugins', plugins)
    await Promise.all((plugins || []).map(async plugin => {
      try {
        const opts: Options = {type, root}
        if (typeof plugin === 'string') {
          opts.name = plugin
        } else {
          opts.name = plugin.name || opts.name
          opts.tag = plugin.tag || opts.tag
          opts.root = plugin.root || opts.root
        }

        const instance = new Plugin.Plugin(opts)
        await instance.load()
        if (this.plugins.find(p => p.name === instance.name)) return
        this.plugins.push(instance)
        if (parent) {
          instance.parent = parent
          if (!parent.children) parent.children = []
          parent.children.push(instance)
        }

        await this.loadPlugins(instance.root, type, instance.pjson.oclif.plugins || [], instance)
      } catch (error: any) {
        this.warn(error, 'loadPlugins')
      }
    }))
  }

  protected warn(err: string | Error | { name: string; detail: string }, scope?: string) {
    if (this.warned) return

    if (typeof err === 'string') {
      process.emitWarning(err)
      return
    }

    if (err instanceof Error) {
      const modifiedErr: any = err
      modifiedErr.name = `${err.name} Plugin: ${this.name}`
      modifiedErr.detail = compact([
        (err as any).detail,
        `module: ${this._base}`,
        scope && `task: ${scope}`,
        `plugin: ${this.name}`,
        `root: ${this.root}`,
        'See more details with DEBUG=*',
      ]).join('\n')
      process.emitWarning(err)
      return
    }

    // err is an object
    process.emitWarning('Config.warn expected either a string or Error, but instead received an object')
    err.name = `${err.name} Plugin: ${this.name}`
    err.detail = compact([
      err.detail,
      `module: ${this._base}`,
      scope && `task: ${scope}`,
      `plugin: ${this.name}`,
      `root: ${this.root}`,
      'See more details with DEBUG=*',
    ]).join('\n')

    process.emitWarning(JSON.stringify(err))
  }

  protected get isProd() {
    return isProd()
  }

  private getCmdLookupId(id: string): string {
    if (this._commands.has(id)) return id
    if (this.commandPermutations.hasValid(id)) return this.commandPermutations.getValid(id)!
    return id
  }

  private getTopicLookupId(id: string): string {
    if (this._topics.has(id)) return id
    if (this.topicPermutations.hasValid(id)) return this.topicPermutations.getValid(id)!
    return id
  }

  private loadCommands(plugin: IPlugin) {
    for (const command of plugin.commands) {
      if (this._commands.has(command.id)) {
        const prioritizedCommand = this.determinePriority([this._commands.get(command.id)!, command])
        this._commands.set(prioritizedCommand.id, prioritizedCommand)
      } else {
        this._commands.set(command.id, command)
      }

      const permutations = this.flexibleTaxonomy ? getCommandIdPermutations(command.id) : [command.id]
      for (const permutation of permutations) {
        this.commandPermutations.add(permutation, command.id)
      }

      for (const alias of command.aliases ?? []) {
        if (this._commands.has(alias)) {
          const prioritizedCommand = this.determinePriority([this._commands.get(alias)!, command])
          this._commands.set(prioritizedCommand.id, {...prioritizedCommand, id: alias})
        } else {
          this._commands.set(alias, {...command, id: alias})
        }

        const aliasPermutations = this.flexibleTaxonomy ? getCommandIdPermutations(alias) : [alias]
        for (const permutation of aliasPermutations) {
          this.commandPermutations.add(permutation, command.id)
        }
      }
    }
  }

  private loadTopics(plugin: IPlugin) {
    for (const topic of compact(plugin.topics)) {
      const existing = this._topics.get(topic.name)
      if (existing) {
        existing.description = topic.description || existing.description
        existing.hidden = existing.hidden || topic.hidden
      } else {
        this._topics.set(topic.name, topic)
      }

      const permutations = this.flexibleTaxonomy ? getCommandIdPermutations(topic.name) : [topic.name]
      for (const permutation of permutations) {
        this.topicPermutations.add(permutation, topic.name)
      }
    }

    // Add missing topics for displaying help when partial commands are entered.
    for (const c of plugin.commands.filter(c => !c.hidden)) {
      const parts = c.id.split(':')
      while (parts.length > 0) {
        const name = parts.join(':')
        if (name && !this._topics.has(name)) {
          this._topics.set(name, {name, description: c.summary || c.description})
        }

        parts.pop()
      }
    }
  }

  /**
   * This method is responsible for locating the correct plugin to use for a named command id
   * It searches the {Config} registered commands to match either the raw command id or the command alias
   * It is possible that more than one command will be found. This is due the ability of two distinct plugins to
   * create the same command or command alias.
   *
   * In the case of more than one found command, the function will select the command based on the order in which
   * the plugin is included in the package.json `oclif.plugins` list. The command that occurs first in the list
   * is selected as the command to run.
   *
   * Commands can also be present from either an install or a link. When a command is one of these and a core plugin
   * is present, this function defers to the core plugin.
   *
   * If there is not a core plugin command present, this function will return the first
   * plugin as discovered (will not change the order)
   *
   * @param commands commands to determine the priority of
   * @returns command instance {Command.Loadable} or undefined
   */
  private determinePriority(commands: Command.Loadable[]): Command.Loadable {
    const oclifPlugins = this.pjson.oclif?.plugins ?? []
    const commandPlugins = commands.sort((a, b) => {
      const pluginAliasA = a.pluginAlias ?? 'A-Cannot-Find-This'
      const pluginAliasB = b.pluginAlias ?? 'B-Cannot-Find-This'
      const aIndex = oclifPlugins.indexOf(pluginAliasA)
      const bIndex = oclifPlugins.indexOf(pluginAliasB)
      // When both plugin types are 'core' plugins sort based on index
      if (a.pluginType === 'core' && b.pluginType === 'core') {
        // If b appears first in the pjson.plugins sort it first
        return aIndex - bIndex
      }

      // if b is a core plugin and a is not sort b first
      if (b.pluginType === 'core' && a.pluginType !== 'core') {
        return 1
      }

      // if a is a core plugin and b is not sort a first
      if (a.pluginType === 'core' && b.pluginType !== 'core') {
        return -1
      }

      // neither plugin is core, so do not change the order
      return 0
    })
    return commandPlugins[0]
  }
}

// when no manifest exists, the default is calculated.  This may throw, so we need to catch it
const defaultToCached = async (flag: CompletableOptionFlag<any>) => {
  // Prefer the helpDefaultValue function (returns a friendly string for complex types)
  if (typeof flag.defaultHelp === 'function') {
    try {
      return await flag.defaultHelp()
    } catch {
      return
    }
  }

  // if not specified, try the default function
  if (typeof flag.default === 'function') {
    try {
      return await flag.default({options: {}, flags: {}})
    } catch {}
  } else {
    return flag.default
  }
}

export async function toCached(c: Command.Class, plugin?: IPlugin): Promise<Command> {
  const flags = {} as {[k: string]: Command.Flag}

  for (const [name, flag] of Object.entries(c.flags || {})) {
    if (flag.type === 'boolean') {
      flags[name] = {
        name,
        type: flag.type,
        char: flag.char,
        summary: flag.summary,
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required,
        helpLabel: flag.helpLabel,
        helpGroup: flag.helpGroup,
        allowNo: flag.allowNo,
        dependsOn: flag.dependsOn,
        exclusive: flag.exclusive,
      }
    } else {
      flags[name] = {
        name,
        type: flag.type,
        char: flag.char,
        summary: flag.summary,
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required,
        helpLabel: flag.helpLabel,
        helpValue: flag.helpValue,
        helpGroup: flag.helpGroup,
        multiple: flag.multiple,
        options: flag.options,
        dependsOn: flag.dependsOn,
        relationships: flag.relationships,
        exclusive: flag.exclusive,
        default: await defaultToCached(flag),
      }
      // a command-level placeholder in the manifest so that oclif knows it should regenerate the command during help-time
      if (typeof flag.defaultHelp === 'function') {
        c.hasDynamicHelp = true
      }
    }
  }

  const argsPromise = (c.args || []).map(async a => ({
    name: a.name,
    description: a.description,
    required: a.required,
    options: a.options,
    default: typeof a.default === 'function' ? await a.default({}) : a.default,
    hidden: a.hidden,
  }))

  const args = await Promise.all(argsPromise)

  const stdProperties = {
    id: c.id,
    summary: c.summary,
    description: c.description,
    strict: c.strict,
    usage: c.usage,
    pluginName: plugin && plugin.name,
    pluginAlias: plugin && plugin.alias,
    pluginType: plugin && plugin.type,
    hidden: c.hidden,
    state: c.state,
    aliases: c.aliases || [],
    examples: c.examples || (c as any).example,
    flags,
    args,
  }

  // do not include these properties in manifest
  const ignoreCommandProperties = ['plugin', '_flags']
  const stdKeys = Object.keys(stdProperties)
  const keysToAdd = Object.keys(c).filter(property => ![...stdKeys, ...ignoreCommandProperties].includes(property))
  const additionalProperties: any = {}
  for (const key of keysToAdd) {
    additionalProperties[key] = (c as any)[key]
  }

  return {...stdProperties, ...additionalProperties}
}
