
import * as Errors from './errors'
import * as Parser from './parser'
import {
  ArgInput,
  ArgOutput,
  ArgProps,
  BooleanFlagProps,
  Deprecation,
  FlagInput,
  FlagOutput,
  Arg as IArg,
  Flag as IFlag,
  Input,
  OptionFlagProps,
  ParserOutput,
} from './interfaces/parser'
import {format, inspect} from 'node:util'
import {formatCommandDeprecationWarning, formatFlagDeprecationWarning, normalizeArgv, toConfiguredId} from './help/util'
import {requireJson, uniq} from './util'
import {stderr, stdout} from './cli-ux/stream'
import {CommandError} from './interfaces/errors'
import {Config} from './config'
import {LoadOptions} from './interfaces/config'
import {PJSON} from './interfaces'
import {Plugin} from './interfaces/plugin'
import {PrettyPrintableError} from './errors'
import chalk from 'chalk'
import {fileURLToPath} from 'node:url'
import {json} from './flags'
import {ux} from './cli-ux'

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
  public static summary?: string

  /**
   * A full description of how to use the command.
   *
   * If no summary, the first line of the description will be used as the summary.
   */
  public static description: string | undefined

  /** Hide the command from help */
  public static hidden: boolean

  /** Mark the command as a given state (e.g. beta or deprecated) in help */
  public static state?: 'beta' | 'deprecated' | string

  public static deprecationOptions?: Deprecation

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

  public static readonly pluginName?: string
  public static readonly pluginType?: string
  public static readonly pluginAlias?: string

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

  public static enableJsonFlag = false
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

  public static baseFlags: FlagInput

  /** A hash of flags for the command */
  public static flags: FlagInput

  public id: string | undefined

  protected debug: (...args: any[]) => void

  public constructor(public argv: string[], public config: Config) {
    this.id = this.ctor.id
    try {
      this.debug = require('debug')(this.id ? `${this.config.bin}:${this.id}` : this.config.bin)
    } catch {
      this.debug = () => {
        // noop
      }
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
    // If the JSON_FLAG_OVERRIDE env var (set by Flags.json parse) is set to true, return true
    // Checking for this first allows commands to define a --json flag using Flags.json()
    // without setting enableJsonFlag static property.
    if (this.config.scopedEnvVarTrue?.('JSON_FLAG_OVERRIDE')) return true

    // If the command doesn't support json, return false
    if (!this.ctor.enableJsonFlag) return false

    // If the CONTENT_TYPE env var is set to json, return true
    if (this.config.scopedEnvVar?.('CONTENT_TYPE')?.toLowerCase() === 'json') return true

    const passThroughIndex = this.argv.indexOf('--')
    const jsonIndex = this.argv.indexOf('--json')
    return passThroughIndex === -1
      // If '--' is not present, then check for `--json` in this.argv
      ? jsonIndex > -1
      // If '--' is present, return true only the --json flag exists and is before the '--'
      : jsonIndex > -1 && jsonIndex < passThroughIndex
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
    const allFlags = this.aggregateFlags(
      this.ctor.flags,
      this.ctor.baseFlags,
      this.ctor.enableJsonFlag,
    )
    for (const flag of Object.keys(flags)) {
      const flagDef = allFlags[flag]
      const deprecated = flagDef?.deprecated
      if (deprecated) {
        this.warn(formatFlagDeprecationWarning(flag, deprecated))
      }

      const deprecateAliases = flagDef?.deprecateAliases
      if (deprecateAliases) {
        const aliases = uniq([...flagDef?.aliases ?? [], ...flagDef?.charAliases ?? []]).map(a => a.length === 1 ? `-${a}` : `--${a}`)
        if (aliases.length === 0) return

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

  protected async parse<F extends FlagOutput, B extends FlagOutput, A extends ArgOutput>(
    options?: Input<F, B, A>,
    argv = this.argv,
  ): Promise<ParserOutput<F, B, A>> {
    if (!options) options = this.ctor as Input<F, B, A>

    const opts = {
      context: this,
      ...options,
      flags: this.aggregateFlags<F, B>(
        options.flags,
        options.baseFlags,
        options.enableJsonFlag,
      ),
    }

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
      const {config} = Errors
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

  private aggregateFlags<F extends FlagOutput, B extends FlagOutput>(
    flags: FlagInput<F> | undefined,
    baseFlags: FlagInput<B> | undefined,
    enableJsonFlag: boolean | undefined,
  ): FlagInput<F> {
    const combinedFlags = {...baseFlags, ...flags}
    return (enableJsonFlag
      ? {...combinedFlags, json: json()}
      : combinedFlags) as FlagInput<F>
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

  export type Flag = IFlag<any>

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
