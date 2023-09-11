import {fileURLToPath} from 'url'
import * as chalk from 'chalk'
import {format, inspect} from 'util'
import {ux} from './cli-ux'
import {Config} from './config'
import * as Errors from './errors'
import {PrettyPrintableError} from './errors'
import * as Parser from './parser'
import {
  BooleanFlagProps,
  CompletableFlag,
  Deprecation,
  Arg as IArg,
  ArgInput,
  FlagInput,
  FlagOutput,
  Input,
  ArgProps,
  OptionFlagProps,
  ParserOutput,
  ArgOutput,
} from './interfaces/parser'
import {formatCommandDeprecationWarning, formatFlagDeprecationWarning, toConfiguredId, normalizeArgv} from './help/util'
import {Plugin} from './interfaces/plugin'
import {LoadOptions} from './interfaces/config'
import {CommandError} from './interfaces/errors'
import {boolean} from './flags'
import {requireJson} from './util'
import {PJSON} from './interfaces'
import {stdout, stderr} from './cli-ux/stream'

const pjson = requireJson<PJSON>(__dirname, '..', 'package.json')

/**
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
stdout.on('error', (err: any) => {
  if (err && err.code === 'EPIPE')
    return
  throw err
})

const jsonFlag = {
  json: boolean({
    description: 'Format output as json.',
    helpGroup: 'GLOBAL',
  }),
}

/**
 * An abstract class which acts as the base for each command
 * in your project.
 */

export abstract class Command {
  private static readonly _base = `${pjson.name}@${pjson.version}`

  /** A command ID, used mostly in error or verbose reporting. */
  public static id: string

  /**
   * The tweet-sized description for your class, used in a parent-commands
   * sub-command listing and as the header for the command help.
   */
  public static summary?: string;

  /**
   * A full description of how to use the command.
   *
   * If no summary, the first line of the description will be used as the summary.
   */
  public static description: string | undefined

  /** Hide the command from help */
  public static hidden: boolean

  /** Mark the command as a given state (e.g. beta or deprecated) in help */
  public static state?: 'beta' | 'deprecated' | string;

  public static deprecationOptions?: Deprecation;

  /**
   * Emit deprecation warning when a command alias is used
   */
  static deprecateAliases?: boolean

  /**
   * An override string (or strings) for the default usage documentation.
   */
  public static usage: string | string[] | undefined

  public static help: string | undefined

  /** An array of aliases for this command. */
  public static aliases: string[] = []

  /** When set to false, allows a variable amount of arguments */
  public static strict = true

  /** An order-dependent object of arguments for the command */
  public static args: ArgInput = {}

  public static plugin: Plugin | undefined

  public static readonly pluginName?: string;
  public static readonly pluginType?: string;
  public static readonly pluginAlias?: string;

  /**
   * An array of examples to show at the end of the command's help.
   *
   * IF only a string is provided, it will try to look for a line that starts
   * with the cmd.bin as the example command and the rest as the description.
   * If found, the command will be formatted appropriately.
   *
   * ```
   * EXAMPLES:
   *   A description of a particular use case.
   *
   *     $ <%= config.bin => command flags
   * ```
   */
  public static examples: Command.Example[]

  public static hasDynamicHelp = false

  protected static '_--' = false

  protected static _enableJsonFlag = false

  public static get enableJsonFlag(): boolean {
    return this._enableJsonFlag
  }

  public static set enableJsonFlag(value: boolean) {
    this._enableJsonFlag = value
    if (value === true) {
      this.baseFlags = jsonFlag
    } else {
      delete this.baseFlags?.json
      this.flags = {} // force the flags setter to run
      delete this.flags?.json
    }
  }

  public static get '--'(): boolean {
    return Command['_--']
  }

  public static set '--'(value: boolean) {
    Command['_--'] = value
  }

  public get passThroughEnabled(): boolean {
    return Command['_--']
  }

  /**
   * instantiate and run the command
   *
   * @param {Command.Class} this - the command class
   * @param {string[]} argv argv
   * @param {LoadOptions} opts options
   * @returns {Promise<unknown>} result
   */
  public static async run<T extends Command>(this: new(argv: string[], config: Config) => T, argv?: string[], opts?: LoadOptions): Promise<ReturnType<T['run']>> {
    if (!argv) argv = process.argv.slice(2)

    // Handle the case when a file URL string is passed in such as 'import.meta.url'; covert to file path.
    if (typeof opts === 'string' && opts.startsWith('file://')) {
      opts = fileURLToPath(opts)
    }

    const config = await Config.load(opts || require.main?.filename || __dirname)
    const cmd = new this(argv, config)
    if (!cmd.id) {
      const id = cmd.constructor.name.toLowerCase()
      cmd.id = id
      cmd.ctor.id = id
    }

    return cmd._run<ReturnType<T['run']>>()
  }

  protected static _baseFlags: FlagInput

  static get baseFlags(): FlagInput {
    return this._baseFlags
  }

  static set baseFlags(flags: FlagInput) {
    this._baseFlags = Object.assign({}, this.baseFlags, flags)
    this.flags = {} // force the flags setter to run
  }

  /** A hash of flags for the command */
  protected static _flags: FlagInput

  public static get flags(): FlagInput {
    return this._flags
  }

  public static set flags(flags: FlagInput) {
    this._flags = Object.assign({}, this._flags ?? {}, this.baseFlags, flags)
  }

  public id: string | undefined

  protected debug: (...args: any[]) => void

  public constructor(public argv: string[], public config: Config) {
    this.id = this.ctor.id
    try {
      this.debug = require('debug')(this.id ? `${this.config.bin}:${this.id}` : this.config.bin)
    } catch {
      this.debug = () => {}
    }
  }

  protected get ctor(): typeof Command {
    return this.constructor as typeof Command
  }

  protected async _run<T>(): Promise<T> {
    let err: Error | undefined
    let result: T | undefined
    try {
      // remove redirected env var to allow subsessions to run autoupdated client
      this.removeEnvVar('REDIRECTED')
      await this.init()
      result = await this.run()
    } catch (error: any) {
      err = error
      await this.catch(error)
    } finally {
      await this.finally(err)
    }

    if (result && this.jsonEnabled()) this.logJson(this.toSuccessJson(result))

    return result as T
  }

  public exit(code = 0): never {
    Errors.exit(code)
  }

  public warn(input: string | Error): string | Error {
    if (!this.jsonEnabled()) Errors.warn(input)
    return input
  }

  public error(input: string | Error, options: {code?: string; exit: false} & PrettyPrintableError): void

  public error(input: string | Error, options?: {code?: string; exit?: number} & PrettyPrintableError): never

  public error(input: string | Error, options: {code?: string; exit?: number | false} & PrettyPrintableError = {}): void {
    return Errors.error(input, options as any)
  }

  public log(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      stdout.write(format(message, ...args) + '\n')
    }
  }

  public logToStderr(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      stderr.write(format(message, ...args) + '\n')
    }
  }

  /**
   * Determine if the command is being run with the --json flag in a command that supports it.
   *
   * @returns {boolean} true if the command supports json and the --json flag is present
   */
  public jsonEnabled(): boolean {
    // if the command doesn't support json, return false
    if (!this.ctor.enableJsonFlag) return false
    // if the command parameter pass through is enabled, return true if the --json flag is before the '--' separator
    if (this.passThroughEnabled) {
      const ptIndex = this.argv.indexOf('--')
      const jsonIndex = this.argv.indexOf('--json')
      return jsonIndex > -1 && (ptIndex === -1 || jsonIndex < ptIndex)
    }

    return this.argv.includes('--json') || this.config.scopedEnvVar?.('CONTENT_TYPE')?.toLowerCase() === 'json'
  }

  /**
   * actual command run code goes here
   */
  public abstract run(): Promise<any>

  protected async init(): Promise<any> {
    this.debug('init version: %s argv: %o', this.ctor._base, this.argv)
    if (this.config.debug) Errors.config.debug = true
    if (this.config.errlog) Errors.config.errlog = this.config.errlog
    const g: any = global
    g['http-call'] = g['http-call'] || {}
    g['http-call']!.userAgent = this.config.userAgent
    this.warnIfCommandDeprecated()
  }

  protected warnIfFlagDeprecated(flags: Record<string, unknown>): void {
    for (const flag of Object.keys(flags)) {
      const flagDef = this.ctor.flags[flag]
      const deprecated = flagDef?.deprecated
      if (deprecated) {
        this.warn(formatFlagDeprecationWarning(flag, deprecated))
      }

      const deprecateAliases = flagDef?.deprecateAliases
      const aliases = ([...flagDef?.aliases ?? [], ...flagDef?.charAliases ?? []]).map(a => a.length === 1 ? `-${a}` : `--${a}`)
      if (deprecateAliases && aliases.length > 0) {
        const foundAliases = aliases.filter(alias => this.argv.some(a => a.startsWith(alias)))
        for (const alias of foundAliases) {
          let preferredUsage = `--${flagDef?.name}`
          if (flagDef?.char) {
            preferredUsage += ` | -${flagDef?.char}`
          }

          this.warn(formatFlagDeprecationWarning(alias, {to: preferredUsage}))
        }
      }
    }
  }

  protected warnIfCommandDeprecated(): void {
    const [id] = normalizeArgv(this.config)

    if (this.ctor.deprecateAliases && this.ctor.aliases.includes(id)) {
      const cmdName = toConfiguredId(this.ctor.id, this.config)
      const aliasName = toConfiguredId(id, this.config)
      this.warn(formatCommandDeprecationWarning(aliasName, {to: cmdName}))
    }

    if (this.ctor.state === 'deprecated') {
      const cmdName = toConfiguredId(this.ctor.id, this.config)
      this.warn(formatCommandDeprecationWarning(cmdName, this.ctor.deprecationOptions))
    }
  }

  protected async parse<F extends FlagOutput, B extends FlagOutput, A extends ArgOutput>(options?: Input<F, B, A>, argv = this.argv): Promise<ParserOutput<F, B, A>> {
    if (!options) options = this.ctor as Input<F, B, A>
    const opts = {context: this, ...options}
    // the spread operator doesn't work with getters so we have to manually add it here
    opts.flags = options?.flags
    opts.args = options?.args
    const results = await Parser.parse<F, B, A>(argv, opts)
    this.warnIfFlagDeprecated(results.flags ?? {})

    return results
  }

  protected async catch(err: CommandError): Promise<any> {
    process.exitCode = process.exitCode ?? err.exitCode ?? 1
    if (this.jsonEnabled()) {
      this.logJson(this.toErrorJson(err))
    } else {
      if (!err.message) throw err
      try {
        ux.action.stop(chalk.bold.red('!'))
      } catch {}

      throw err
    }
  }

  protected async finally(_: Error | undefined): Promise<any> {
    try {
      const config = Errors.config
      if (config.errorLogger) await config.errorLogger.flush()
    } catch (error: any) {
      console.error(error)
    }
  }

  protected toSuccessJson(result: unknown): any {
    return result
  }

  protected toErrorJson(err: unknown): any {
    return {error: err}
  }

  protected logJson(json: unknown): void {
    ux.styledJSON(json)
  }

  private removeEnvVar(envVar: string): void {
    const keys: string[] = []
    try {
      keys.push(...this.config.scopedEnvVarKeys(envVar))
    } catch {
      keys.push(this.config.scopedEnvVarKey(envVar))
    }

    keys.map(key => delete process.env[key])
  }
}

export namespace Command {
  export type Class = typeof Command & {
    id: string;
    run(argv?: string[], config?: LoadOptions): Promise<any>;
  }

  export interface Loadable extends Cached {
    load(): Promise<Command.Class>
  }

  export type Cached = {
    [key: string]: unknown;
    id: string;
    hidden: boolean;
    state?: 'beta' | 'deprecated' | string;
    deprecationOptions?: Deprecation;
    aliases: string[];
    summary?: string;
    description?: string;
    usage?: string | string[];
    examples?: Example[];
    strict?: boolean;
    type?: string;
    pluginName?: string;
    pluginType?: string;
    pluginAlias?: string;
    flags: {[name: string]: Flag.Cached};
    args: {[name: string]: Arg.Cached};
    hasDynamicHelp?: boolean;
    permutations?: string[]
    aliasPermutations?: string[];
    isESM?: boolean;
    relativePath?: string[];
  }

  export type Flag = CompletableFlag<any>

  export namespace Flag {
    export type Cached = Omit<Flag, 'parse' | 'input'> & (BooleanFlagProps | OptionFlagProps)
    export type Any = Flag | Cached
  }

  export type Arg = IArg<any>

  export namespace Arg {
    export type Cached = Omit<Arg, 'parse' | 'input'> & ArgProps
    export type Any = Arg | Cached
  }

  export type Example = string | {
    description: string;
    command: string;
  }
}
