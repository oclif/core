import {fileURLToPath} from 'url'

import {format, inspect} from 'util'
import {CliUx} from './index'
import {Config} from './config'
import * as Interfaces from './interfaces'
import * as Errors from './errors'
import {PrettyPrintableError} from './errors'
import * as Parser from './parser'
import * as Flags from './flags'

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

/**
 * An abstract class which acts as the base for each command
 * in your project.
 */

export default abstract class Command {
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

  /** Hide the command from help? */
  static hidden: boolean

  /** Mark the command as a given state (e.g. beta) in help? */
  static state?: string;

  /**
   * An override string (or strings) for the default usage documentation.
   */
  static usage: string | string[] | undefined

  static help: string | undefined

  /** An array of aliases for this command. */
  static aliases: string[] = []

  /** When set to false, allows a variable amount of arguments */
  static strict = true

  static parse = true

  /** An order-dependent array of arguments for the command */
  static args?: Interfaces.ArgInput

  static plugin: Interfaces.Plugin | undefined

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
  static examples: Interfaces.Example[]

  static parserOptions = {}

  static enableJsonFlag = false

  // eslint-disable-next-line valid-jsdoc
  /**
   * instantiate and run the command
   * @param {Interfaces.Command.Class} this Class
   * @param {string[]} argv argv
   * @param {Interfaces.LoadOptions} opts options
   */
  static run: Interfaces.Command.Class['run'] = async function (this: Interfaces.Command.Class, argv?: string[], opts?) {
    if (!argv) argv = process.argv.slice(2)

    // Handle the case when a file URL string is passed in such as 'import.meta.url'; covert to file path.
    if (typeof opts === 'string' && opts.startsWith('file://')) {
      opts = fileURLToPath(opts)
    }

    // to-do: update in node-14 to module.main
    const config = await Config.load(opts || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname)
    const cmd = new this(argv, config)
    return cmd._run(argv)
  }

  private static globalFlags = {
    json: Flags.boolean({
      description: 'Format output as json.',
      helpGroup: 'GLOBAL',
    }),
  }

  /** A hash of flags for the command */
  private static _flags: Interfaces.FlagInput<any>

  static get flags(): Interfaces.FlagInput<any> {
    return this._flags
  }

  static set flags(flags: Interfaces.FlagInput<any>) {
    this._flags = this.enableJsonFlag ? Object.assign({}, Command.globalFlags, flags) : flags
  }

  id: string | undefined

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
      // tslint:disable-next-line strict-type-predicates
      message = typeof message === 'string' ? message : inspect(message)
      process.stdout.write(format(message, ...args) + '\n')
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
    // global['cli-ux'].context = global['cli-ux'].context || {
    //   command: compact([this.id, ...this.argv]).join(' '),
    //   version: this.config.userAgent,
    // }
    const g: any = global
    g['http-call'] = g['http-call'] || {}
    g['http-call']!.userAgent = this.config.userAgent
  }

  protected async parse<F, A extends { [name: string]: any }>(options?: Interfaces.Input<F>, argv = this.argv): Promise<Interfaces.ParserOutput<F, A>> {
    if (!options) options = this.constructor as any
    const opts = {context: this, ...options}
    // the spread operator doesn't work with getters so we have to manually add it here
    opts.flags = options?.flags
    return Parser.parse(argv, opts)
  }

  protected async catch(err: Record<string, any>): Promise<any> {
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
      // tslint:disable-next-line no-console
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
