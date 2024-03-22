import chalk from 'chalk'
import {fileURLToPath} from 'node:url'
import {inspect} from 'node:util'

import Cache from './cache'
import {ux} from './cli-ux'
import {Config} from './config'
import * as Errors from './errors'
import {PrettyPrintableError} from './errors'
import {formatCommandDeprecationWarning, formatFlagDeprecationWarning, normalizeArgv} from './help/util'
import {LoadOptions} from './interfaces/config'
import {CommandError} from './interfaces/errors'
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
import {Plugin} from './interfaces/plugin'
import * as Parser from './parser'
import {aggregateFlags} from './util/aggregate-flags'
import {toConfiguredId} from './util/ids'
import {uniq} from './util/util'

const pjson = Cache.getInstance().get('@oclif/core')

/**
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
process.stdout.on('error', (err: any) => {
  if (err && err.code === 'EPIPE') return
  throw err
})

/**
 * An abstract class which acts as the base for each command
 * in your project.
 */

export abstract class Command {
  /** An array of aliases for this command. */
  public static aliases: string[] = []

  /** An order-dependent object of arguments for the command */
  public static args: ArgInput = {}

  public static baseFlags: FlagInput

  /**
   * Emit deprecation warning when a command alias is used
   */
  static deprecateAliases?: boolean

  public static deprecationOptions?: Deprecation

  /**
   * A full description of how to use the command.
   *
   * If no summary, the first line of the description will be used as the summary.
   */
  public static description: string | undefined

  public static enableJsonFlag = false

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

  /** A hash of flags for the command */
  public static flags: FlagInput

  public static hasDynamicHelp = false

  public static help: string | undefined

  /** Hide the command from help */
  public static hidden: boolean

  /** An array of aliases for this command that are hidden from help. */
  public static hiddenAliases: string[] = []

  /** A command ID, used mostly in error or verbose reporting. */
  public static id: string

  public static plugin: Plugin | undefined

  public static readonly pluginAlias?: string
  public static readonly pluginName?: string
  public static readonly pluginType?: string

  /** Mark the command as a given state (e.g. beta or deprecated) in help */
  public static state?: 'beta' | 'deprecated' | string

  /** When set to false, allows a variable amount of arguments */
  public static strict = true

  /**
   * The tweet-sized description for your class, used in a parent-commands
   * sub-command listing and as the header for the command help.
   */
  public static summary?: string
  /**
   * An override string (or strings) for the default usage documentation.
   */
  public static usage: string | string[] | undefined

  protected debug: (...args: any[]) => void

  public id: string | undefined

  private static readonly _base = `${pjson.name}@${pjson.version}`

  public constructor(
    public argv: string[],
    public config: Config,
  ) {
    this.id = this.ctor.id
    try {
      this.debug = require('debug')(this.id ? `${this.config.bin}:${this.id}` : this.config.bin)
    } catch {
      this.debug = () => {
        // noop
      }
    }
  }

  /**
   * actual command run code goes here
   */
  public abstract run(): Promise<any>

  /**
   * instantiate and run the command
   *
   * @param {Command.Class} this - the command class
   * @param {string[]} argv argv
   * @param {LoadOptions} opts options
   * @returns {Promise<unknown>} result
   */
  public static async run<T extends Command>(
    this: new (argv: string[], config: Config) => T,
    argv?: string[],
    opts?: LoadOptions,
  ): Promise<ReturnType<T['run']>> {
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

  protected get ctor(): typeof Command {
    return this.constructor as typeof Command
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

  public error(input: Error | string, options: {code?: string; exit: false} & PrettyPrintableError): void

  public error(input: Error | string, options?: {code?: string; exit?: number} & PrettyPrintableError): never

  public error(
    input: Error | string,
    options: {code?: string; exit?: false | number} & PrettyPrintableError = {},
  ): void {
    return Errors.error(input, options as any)
  }

  public exit(code = 0): never {
    Errors.exit(code)
  }

  protected async finally(_: Error | undefined): Promise<any> {
    try {
      const {config} = Errors
      if (config.errorLogger) await config.errorLogger.flush()
    } catch (error: any) {
      console.error(error)
    }
  }

  protected async init(): Promise<any> {
    this.debug('init version: %s argv: %o', this.ctor._base, this.argv)
    if (this.config.debug) Errors.config.debug = true
    if (this.config.errlog) Errors.config.errlog = this.config.errlog
    const g: any = global
    g['http-call'] = g['http-call'] || {}
    g['http-call']!.userAgent = this.config.userAgent
    this.warnIfCommandDeprecated()
  }

  /**
   * Determine if the command is being run with the --json flag in a command that supports it.
   *
   * @returns {boolean} true if the command supports json and the --json flag is present
   */
  public jsonEnabled(): boolean {
    // If the command doesn't support json, return false
    if (!this.ctor.enableJsonFlag) return false

    // If the CONTENT_TYPE env var is set to json, return true
    if (this.config.scopedEnvVar?.('CONTENT_TYPE')?.toLowerCase() === 'json') return true

    const passThroughIndex = this.argv.indexOf('--')
    const jsonIndex = this.argv.indexOf('--json')
    return passThroughIndex === -1
      ? // If '--' is not present, then check for `--json` in this.argv
        jsonIndex > -1
      : // If '--' is present, return true only the --json flag exists and is before the '--'
        jsonIndex > -1 && jsonIndex < passThroughIndex
  }

  public log(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      ux.info(message, ...args)
    }
  }

  protected logJson(json: unknown): void {
    ux.styledJSON(json)
  }

  public logToStderr(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      ux.logToStderr(message, ...args)
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
      flags: aggregateFlags<F, B>(options.flags, options.baseFlags, options.enableJsonFlag),
    }

    const hookResult = await this.config.runHook('preparse', {argv: [...argv], options: opts})

    // Since config.runHook will only run the hook for the root plugin, hookResult.successes will always have a length of 0 or 1
    // But to be extra safe, we find the result that matches the root plugin.
    const argvToParse = hookResult.successes?.length
      ? hookResult.successes.find((s) => s.plugin.root === Cache.getInstance().get('rootPlugin')?.root)?.result ?? argv
      : argv
    this.argv = [...argvToParse]
    const results = await Parser.parse<F, B, A>(argvToParse, opts)
    this.warnIfFlagDeprecated(results.flags ?? {})

    return results
  }

  protected toErrorJson(err: unknown): any {
    return {error: err}
  }

  protected toSuccessJson(result: unknown): any {
    return result
  }

  public warn(input: Error | string): Error | string {
    if (!this.jsonEnabled()) Errors.warn(input)
    return input
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

  protected warnIfFlagDeprecated(flags: Record<string, unknown>): void {
    const allFlags = aggregateFlags(this.ctor.flags, this.ctor.baseFlags, this.ctor.enableJsonFlag)
    for (const flag of Object.keys(flags)) {
      const flagDef = allFlags[flag]
      const deprecated = flagDef?.deprecated
      if (deprecated) {
        this.warn(formatFlagDeprecationWarning(flag, deprecated))
      }

      const deprecateAliases = flagDef?.deprecateAliases
      if (deprecateAliases) {
        const aliases = uniq([...(flagDef?.aliases ?? []), ...(flagDef?.charAliases ?? [])]).map((a) =>
          a.length === 1 ? `-${a}` : `--${a}`,
        )
        if (aliases.length === 0) return

        const foundAliases = aliases.filter((alias) => this.argv.some((a) => a.startsWith(alias)))
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

  private removeEnvVar(envVar: string): void {
    const keys: string[] = []
    try {
      keys.push(...this.config.scopedEnvVarKeys(envVar))
    } catch {
      keys.push(this.config.scopedEnvVarKey(envVar))
    }

    keys.map((key) => delete process.env[key])
  }
}

export namespace Command {
  /**
   * The Command class exported by a command file.
   */
  export type Class = typeof Command & {
    id: string
    run(argv?: string[], config?: LoadOptions): Promise<any>
  }

  /**
   * A cached command that's had a `load` method attached to it.
   *
   * The `Plugin` class loads the commands from the manifest (if it exists) or requires and caches
   * the commands directly from the commands directory inside the plugin. At this point the plugin
   * is working with `Command.Cached`. It then appends a `load` method to each one. If the a command
   * is executed then the `load` method is used to require the command class.
   */
  export type Loadable = Cached & {
    load(): Promise<Command.Class>
  }

  /**
   * A cached version of the command. This is created by the cachedCommand utility and
   * stored in the oclif.manifest.json.
   */
  export type Cached = {
    [key: string]: unknown
    aliasPermutations?: string[]
    aliases: string[]
    args: {[name: string]: Arg.Cached}
    deprecateAliases?: boolean
    deprecationOptions?: Deprecation
    description?: string
    examples?: Example[]
    flags: {[name: string]: Flag.Cached}
    hasDynamicHelp?: boolean
    hidden: boolean
    hiddenAliases: string[]
    id: string
    isESM?: boolean
    permutations?: string[]
    pluginAlias?: string
    pluginName?: string
    pluginType?: string
    relativePath?: string[]
    state?: 'beta' | 'deprecated' | string
    strict?: boolean
    summary?: string
    type?: string
    usage?: string | string[]
  }

  export type Flag = IFlag<any>

  export namespace Flag {
    export type Cached = Omit<Flag, 'input' | 'parse'> &
      (BooleanFlagProps | OptionFlagProps) & {hasDynamicHelp?: boolean}
    export type Any = Cached | Flag
  }

  export type Arg = IArg<any>

  export namespace Arg {
    export type Cached = Omit<Arg, 'input' | 'parse'> & ArgProps
    export type Any = Arg | Cached
  }

  export type Example =
    | {
        command: string
        description: string
      }
    | string
}
