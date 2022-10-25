import {fileURLToPath} from 'url'

import {format, inspect} from 'util'
import {CliUx, toConfiguredId} from './index'
import {Config} from './config'
import * as Interfaces from './interfaces'
import * as Errors from './errors'
import {PrettyPrintableError} from './errors'
import * as Parser from './parser'
import * as Flags from './flags'
import {BooleanFlagProps, Deprecation} from './interfaces/parser'
import {formatCommandDeprecationWarning, formatFlagDeprecationWarning} from './help/util'

const pjson = require('../package.json')

/**
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
process.stdout.on('error', (err: any) => {
  if (err && err.code === 'EPIPE')
    return
  throw err
})

const jsonFlag = {
  json: Flags.boolean({
    description: 'Format output as json.',
    helpGroup: 'GLOBAL',
  }),
}

/**
 * An abstract class which acts as the base for each command
 * in your project.
 */

export abstract class Command {
  static _base = `${pjson.name}@${pjson.version}`

  /** A command ID, used mostly in error or verbose reporting. */
  static id: string

  /**
   * The tweet-sized description for your class, used in a parent-commands
   * sub-command listing and as the header for the command help.
   */
  static summary?: string;

  /**
   * A full description of how to use the command.
   *
   * If no summary, the first line of the description will be used as the summary.
   */
  static description: string | undefined

  /** Hide the command from help */
  static hidden: boolean

  /** Mark the command as a given state (e.g. beta or deprecated) in help */
  static state?: 'beta' | 'deprecated' | string;

  static deprecationOptions?: Deprecation;

  /**
   * An override string (or strings) for the default usage documentation.
   */
  static usage: string | string[] | undefined

  static help: string | undefined

  /** An array of aliases for this command. */
  static aliases: string[] = []

  /** When set to false, allows a variable amount of arguments */
  static strict = true

  /** An order-dependent array of arguments for the command */
  static args?: Interfaces.ArgInput

  static plugin: Interfaces.Plugin | undefined

  static readonly pluginName?: string;
  static readonly pluginType?: string;
  static readonly pluginAlias?: string;

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
  static examples: Command.Example[]

  static hasDynamicHelp = false

  static _enableJsonFlag = false

  static get enableJsonFlag(): boolean {
    return this._enableJsonFlag
  }

  static set enableJsonFlag(value: boolean) {
    this._enableJsonFlag = value
    if (value === true) {
      this.globalFlags = jsonFlag
    } else {
      delete this.globalFlags?.json
      this.flags = {} // force the flags setter to run
      delete this.flags?.json
    }
  }

  /**
   * instantiate and run the command
   *
   * @param {Command.Class} this - the command class
   * @param {string[]} argv argv
   * @param {Interfaces.LoadOptions} opts options
   * @returns {Promise<unknown>} result
   */
  static async run<T extends Command>(this: new(argv: string[], config: Config) => T, argv?: string[], opts?: Interfaces.LoadOptions): Promise<unknown> {
    if (!argv) argv = process.argv.slice(2)

    // Handle the case when a file URL string is passed in such as 'import.meta.url'; covert to file path.
    if (typeof opts === 'string' && opts.startsWith('file://')) {
      opts = fileURLToPath(opts)
    }

    const config = await Config.load(opts || require.main?.filename || __dirname)
    const cmd = new this(argv, config)
    return cmd._run()
  }

  protected static _globalFlags: Interfaces.FlagInput

  static get globalFlags(): Interfaces.FlagInput {
    return this._globalFlags
  }

  static set globalFlags(flags: Interfaces.FlagInput) {
    this._globalFlags = Object.assign({}, this.globalFlags, flags)
    this.flags = {} // force the flags setter to run
  }

  /** A hash of flags for the command */
  protected static _flags: Interfaces.FlagInput

  static get flags(): Interfaces.FlagInput {
    return this._flags
  }

  static set flags(flags: Interfaces.FlagInput) {
    this._flags = Object.assign({}, this._flags ?? {}, this.globalFlags, flags)
  }

  id: string | undefined
  // id: string

  protected debug: (...args: any[]) => void

  constructor(public argv: string[], public config: Config) {
    this.id = this.ctor.id
    try {
      this.debug = require('debug')(this.id ? `${this.config.bin}:${this.id}` : this.config.bin)
    } catch {
      this.debug = () => {}
    }
  }

  get ctor(): typeof Command {
    return this.constructor as typeof Command
  }

  async _run<T>(): Promise<T | undefined> {
    let err: Error | undefined
    let result
    try {
      // remove redirected env var to allow subsessions to run autoupdated client
      delete process.env[this.config.scopedEnvVarKey('REDIRECTED')]
      await this.init()
      result = await this.run()
    } catch (error: any) {
      err = error
      await this.catch(error)
    } finally {
      await this.finally(err)
    }

    if (result && this.jsonEnabled()) {
      CliUx.ux.styledJSON(this.toSuccessJson(result))
    }

    return result
  }

  exit(code = 0): void {
    return Errors.exit(code)
  }

  warn(input: string | Error): string | Error {
    if (!this.jsonEnabled()) Errors.warn(input)
    return input
  }

  error(input: string | Error, options: {code?: string; exit: false} & PrettyPrintableError): void

  error(input: string | Error, options?: {code?: string; exit?: number} & PrettyPrintableError): never

  error(input: string | Error, options: {code?: string; exit?: number | false} & PrettyPrintableError = {}): void {
    return Errors.error(input, options as any)
  }

  log(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      process.stdout.write(format(message, ...args) + '\n')
    }
  }

  logToStderr(message = '', ...args: any[]): void {
    if (!this.jsonEnabled()) {
      message = typeof message === 'string' ? message : inspect(message)
      process.stderr.write(format(message, ...args) + '\n')
    }
  }

  public jsonEnabled(): boolean {
    return this.ctor.enableJsonFlag && this.argv.includes('--json')
  }

  /**
   * actual command run code goes here
   */
  abstract run(): PromiseLike<any>

  protected async init(): Promise<any> {
    this.debug('init version: %s argv: %o', this.ctor._base, this.argv)
    if (this.config.debug) Errors.config.debug = true
    if (this.config.errlog) Errors.config.errlog = this.config.errlog
    const g: any = global
    g['http-call'] = g['http-call'] || {}
    g['http-call']!.userAgent = this.config.userAgent
    this.warnIfCommandDeprecated()
  }

  protected warnIfFlagDeprecated(flags: Record<string, unknown>) {
    for (const flag of Object.keys(flags)) {
      const deprecated = this.ctor.flags[flag]?.deprecated
      if (deprecated) {
        this.warn(formatFlagDeprecationWarning(flag, deprecated))
      }
    }
  }

  protected warnIfCommandDeprecated(): void {
    if (this.ctor.state === 'deprecated') {
      const cmdName = toConfiguredId(this.ctor.id, this.config)
      this.warn(formatCommandDeprecationWarning(cmdName, this.ctor.deprecationOptions))
    }
  }

  protected async parse<F extends Interfaces.FlagOutput, G extends Interfaces.FlagOutput, A extends { [name: string]: any }>(options?: Interfaces.Input<F, G>, argv = this.argv): Promise<Interfaces.ParserOutput<F, G, A>> {
    if (!options) options = this.constructor as any
    const opts = {context: this, ...options}
    // the spread operator doesn't work with getters so we have to manually add it here
    opts.flags = options?.flags
    opts.args = options?.args
    const results = await Parser.parse<F, G, A>(argv, opts)
    this.warnIfFlagDeprecated(results.flags ?? {})

    return results
  }

  protected async catch(err: Interfaces.CommandError): Promise<any> {
    process.exitCode = process.exitCode ?? err.exitCode ?? 1
    if (this.jsonEnabled()) {
      CliUx.ux.styledJSON(this.toErrorJson(err))
    } else {
      if (!err.message) throw err
      try {
        const chalk = require('chalk')
        CliUx.ux.action.stop(chalk.bold.red('!'))
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
}

export namespace Command {
  export type Class = typeof Command & {
    id: string;
    run(argv?: string[], config?: Interfaces.LoadOptions): PromiseLike<any>;
  }

  export interface Loadable extends Cached {
    load(): Promise<Command.Class>
  }

  export interface Cached {
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
    args: Interfaces.Arg[];
    hasDynamicHelp?: boolean;
  }

  export type Flag = Interfaces.CompletableFlag<any>

  export namespace Flag {
    export type Cached = Omit<Flag, 'parse' | 'input'> & (BooleanFlagProps | Interfaces.OptionFlagProps)
    export type Any = Flag | Cached
  }

  export type Example = string | {
    description: string;
    command: string;
  }
}
