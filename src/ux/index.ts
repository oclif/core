import * as Errors from '../errors'
import * as util from 'util'
import * as chalk from 'chalk'
import {ActionBase} from './action/base'
import {config, Config} from './config'
import {ExitError} from './exit'
import {IPromptOptions} from './prompt'
import * as styled from './styled'
import {Table} from './styled'
export * from './styled/table'
import * as uxPrompt from './prompt'
import uxWait from './wait'
import {stdout} from './stream'
import * as _flush from './flush'

const hyperlinker = require('hyperlinker')

export default class ux {
  public static config: Config = config

  public static get prompt(): typeof uxPrompt.prompt {
    return uxPrompt.prompt
  }

  /**
   * "press anykey to continue"
   */
  public static get anykey(): typeof uxPrompt.anykey {
    return uxPrompt.anykey
  }

  public static get confirm(): typeof uxPrompt.confirm {
    return uxPrompt.confirm
  }

  public static get action(): ActionBase {
    return config.action
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static styledObject(obj: any, keys?: string[]): void {
    this.info(styled.styledObject(obj, keys))
  }

  public static styledHeader(header: string): void {
    this.info(chalk.dim('=== ') + chalk.bold(header) + '\n')
  }

  public static get styledJSON(): typeof styled.styledJSON {
    return styled.styledJSON
  }

  public static get table(): typeof styled.Table.table {
    return styled.Table.table
  }

  public static get tree(): typeof styled.tree {
    return styled.tree
  }

  public static get wait(): typeof uxWait {
    return uxWait
  }

  public static get progress(): typeof styled.progress {
    return styled.progress
  }

  public static async done(): Promise<void> {
    config.action.stop()
  }

  public static trace(format: string, ...args: string[]): void {
    if (this.config.outputLevel === 'trace') {
      stdout.write(util.format(format, ...args) + '\n')
    }
  }

  public static debug(format: string, ...args: string[]): void {
    if (['trace', 'debug'].includes(this.config.outputLevel)) {
      stdout.write(util.format(format, ...args) + '\n')
    }
  }

  public static info(format: string, ...args: string[]): void {
    stdout.write(util.format(format, ...args) + '\n')
  }

  public static log(format?: string, ...args: string[]): void {
    this.info(format || '', ...args)
  }

  public static url(text: string, uri: string, params = {}): void {
    const supports = require('supports-hyperlinks')
    if (supports.stdout) {
      this.log(hyperlinker(text, uri, params))
    } else {
      this.log(uri)
    }
  }

  public static annotation(text: string, annotation: string): void {
    const supports = require('supports-hyperlinks')
    if (supports.stdout) {
      // \u001b]8;;https://google.com\u0007sometext\u001b]8;;\u0007
      this.log(`\u001B]1337;AddAnnotation=${text.length}|${annotation}\u0007${text}`)
    } else {
      this.log(text)
    }
  }

  public static async flush(ms = 10_000): Promise<void> {
    await _flush.default(ms)
  }
}

const action = ux.action
const annotation = ux.annotation
const anykey = ux.anykey
const confirm = ux.confirm
const debug = ux.debug
const done = ux.done
const error = Errors.error
const exit = Errors.exit
const flush = ux.flush
const info = ux.info
const log = ux.log
const progress = ux.progress
const prompt = ux.prompt
const styledHeader = ux.styledHeader
const styledJSON = ux.styledJSON
const styledObject = ux.styledObject
const table = ux.table
const trace = ux.trace
const tree = ux.tree
const url = ux.url
const wait = ux.wait
const warn = Errors.warn

export {
  action,
  annotation,
  anykey,
  confirm,
  debug,
  done,
  error,
  exit,
  flush,
  info,
  log,
  progress,
  prompt,
  styledHeader,
  styledJSON,
  styledObject,
  table,
  trace,
  tree,
  url,
  wait,
  warn,
  ActionBase,
  config,
  Config,
  ExitError,
  IPromptOptions,
  Table,
}

const uxProcessExitHandler = async () => {
  try {
    await ux.done()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

// to avoid MaxListenersExceededWarning
// only attach named listener once
const uxListener = process.listeners('exit').find(fn => fn.name === uxProcessExitHandler.name)
if (!uxListener) {
  process.once('exit', uxProcessExitHandler)
}
