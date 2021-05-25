import {fileURLToPath} from 'url'

import {format, inspect} from 'util'

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

  /** A command ID, used mostly in error or verbose reporting */
  static id: string

  // to-do: Confirm unused?
  static title: string | undefined

  /**
   * The tweet-sized description for your class, used in a parent-commands
   * sub-command listing and as the header for the command help
   */
  static description: string | undefined

  /** hide the command from help? */
  static hidden: boolean

  /** An override string (or strings) for the default usage documentation */
  static usage: string | string[] | undefined

  static help: string | undefined

  /** An array of aliases for this command */
  static aliases: string[] = []

  /** When set to false, allows a variable amount of arguments */
  static strict = true

  static parse = true

  /** An order-dependent array of arguments for the command */
  static args?: Interfaces.ArgInput

  static plugin: Interfaces.Plugin | undefined

  /** An array of example strings to show at the end of the command's help */
  static examples: string[] | undefined

  static parserOptions = {}

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

    const config = await Config.load(opts || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname)
    const cmd = new this(argv, config)
    return cmd._run(argv)
  }

  /** A hash of flags for the command */
  static _flags: Interfaces.FlagInput<any>

  private static globalFlags = {
    json: Flags.boolean({
      description: 'format output as json',
    }),
  }

  static get flags(): Interfaces.FlagInput<any> {
    return Command._flags
  }

  static set flags(flags: Interfaces.FlagInput<any>) {
    Command._flags = Object.assign({}, flags, Command.globalFlags)
  }

  id: string | undefined

  protected debug: (...args: any[]) => void

  constructor(public argv: string[], public config: Interfaces.Config) {
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
    } catch (error) {
      err = error
      await this.catch(error)
    } finally {
      await this.finally(err)
    }

    if (result && this.jsonEnabled()) {
      console.log(result)
    }
    return result
  }

  exit(code = 0) {
    return Errors.exit(code)
  }

  warn(input: string | Error) {
    Errors.warn(input)
  }

  error(input: string | Error, options: {code?: string; exit: false} & PrettyPrintableError): void

  error(input: string | Error, options?: {code?: string; exit?: number} & PrettyPrintableError): never

  error(input: string | Error, options: {code?: string; exit?: number | false} & PrettyPrintableError = {}) {
    return Errors.error(input, options as any)
  }

  log(message = '', ...args: any[]) {
    if (!this.jsonEnabled()) {
      // tslint:disable-next-line strict-type-predicates
      message = typeof message === 'string' ? message : inspect(message)
      process.stdout.write(format(message, ...args) + '\n')
    }
  }

  public jsonEnabled(): boolean {
    return this.argv.includes('--json')
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

  protected async catch(err: any): Promise<any> {
    if (this.jsonEnabled()) {
      console.log({
        status: process.exitCode,
        err,
      })
    } else {
      if (!err.message) throw err
      try {
        const {cli} = require('cli-ux')
        const chalk = require('chalk') // eslint-disable-line node/no-extraneous-require
        cli.action.stop(chalk.bold.red('!'))
      } catch {}
      throw err
    }
  }

  protected async finally(_: Error | undefined): Promise<any> {
    try {
      const config = Errors.config
      if (config.errorLogger) await config.errorLogger.flush()
      // tslint:disable-next-line no-console
    } catch (error) {
      console.error(error)
    }
  }
}
