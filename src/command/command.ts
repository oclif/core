const pjson = require('../package.json')
import * as Config from '@oclif/config'
import * as Errors from '@oclif/errors'
import * as Parser from '@oclif/parser'
import {HelpBase} from '@oclif/plugin-help'
import {format, inspect} from 'util'

import * as flags from './flags'
import {sortBy, uniqBy} from './util'
import {getHelpClass} from '@oclif/plugin-help'
import {PrettyPrintableError} from '@oclif/errors'

/**
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
process.stdout.on('error', err => {
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

  /** A hash of flags for the command */
  static flags?: flags.Input<any>

  /** An order-dependent array of arguments for the command */
  static args?: Parser.args.Input

  static plugin: Config.IPlugin | undefined

  /** An array of example strings to show at the end of the command's help */
  static examples: string[] | undefined

  static parserOptions = {}

  /**
   * instantiate and run the command
   * @param {Config.Command.Class} this Class
   * @param {string[]} argv argv
   * @param {Config.LoadOptions} opts options
   */
  static run: Config.Command.Class['run'] = async function (this: Config.Command.Class, argv?: string[], opts?) {
    if (!argv) argv = process.argv.slice(2)
    const config = await Config.load(opts || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname)
    const cmd = new this(argv, config)
    return cmd._run(argv)
  }

  id: string | undefined

  protected debug: (...args: any[]) => void

  constructor(public argv: string[], public config: Config.IConfig) {
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
    try {
      // remove redirected env var to allow subsessions to run autoupdated client
      delete process.env[this.config.scopedEnvVarKey('REDIRECTED')]

      await this.init()
      return await this.run()
    } catch (error) {
      err = error
      await this.catch(error)
    } finally {
      await this.finally(err)
    }
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
    // tslint:disable-next-line strict-type-predicates
    message = typeof message === 'string' ? message : inspect(message)
    process.stdout.write(format(message, ...args) + '\n')
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
    if (this._helpOverride()) return this._help()
  }

  protected parse<F, A extends {[name: string]: any}>(options?: Parser.Input<F>, argv = this.argv): Parser.Output<F, A> {
    if (!options) options = this.constructor as any
    return require('@oclif/parser').parse(argv, {context: this, ...options})
  }

  protected async catch(err: any): Promise<any> {
    if (!err.message) throw err
    if (err.message.match(/Unexpected arguments?: (-h|--help|help)(,|\n)/)) {
      return this._help()
    }
    if (err.message.match(/Unexpected arguments?: (-v|--version|version)(,|\n)/)) {
      return this._version()
    }
    try {
      const {cli} = require('cli-ux')
      const chalk = require('chalk') // eslint-disable-line node/no-extraneous-require
      cli.action.stop(chalk.bold.red('!'))
    } catch {}
    throw err
  }

  protected async finally(_: Error | undefined): Promise<any> {
    try {
      const config = require('@oclif/errors').config
      if (config.errorLogger) await config.errorLogger.flush()
      // tslint:disable-next-line no-console
    } catch (error) {
      console.error(error)
    }
  }

  protected _help() {
    const HelpClass = getHelpClass(this.config)
    const help: HelpBase = new HelpClass(this.config)
    const cmd = Config.Command.toCached(this.ctor as any as Config.Command.Class)
    if (!cmd.id) cmd.id = ''
    let topics = this.config.topics
    topics = topics.filter((t: any) => !t.hidden)
    topics = sortBy(topics, (t: any) => t.name)
    topics = uniqBy(topics, (t: any) => t.name)
    help.showCommandHelp(cmd, topics)
    return this.exit(0)
  }

  protected _helpOverride(): boolean {
    for (const arg of this.argv) {
      if (arg === '--help') return true
      if (arg === '--') return false
    }
    return false
  }

  protected _version() {
    this.log(this.config.userAgent)
    return this.exit(0)
  }
}
