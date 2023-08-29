import * as Errors from '../errors'
import * as util from 'util'
import * as chalk from 'chalk'
import {ActionBase} from './action/base'
import {config, Config} from './config'
import {ExitError} from './exit'
import {IPromptOptions} from './prompt'
import * as styled from './styled'
import {Table} from './styled'
import * as uxPrompt from './prompt'
import uxWait from './wait'
import {stdout} from './stream'
import flush from './flush'

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
    this.log(styled.styledObject(obj, keys))
  }

  public static styledHeader(header: string): void {
    this.log(chalk.dim('=== ') + chalk.bold(header) + '\n')
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
    if (ux.config.outputLevel === 'trace') {
      stdout.write(util.format(format, ...args) + '\n')
    }
  }

  public static debug(format: string, ...args: string[]): void {
    if (['trace', 'debug'].includes(ux.config.outputLevel)) {
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
    await flush(ms)
  }

  public static error(err: Error | string, options: {code?: string; exit?: number} = {}): never {
    throw Errors.error(err, options)
  }

  public static exit(code = 0): never {
    throw Errors.exit(code)
  }

  public static warn(err: Error | string): void {
    Errors.warn(err)
  }
}

export {
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
