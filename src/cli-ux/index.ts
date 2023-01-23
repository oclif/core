import * as Errors from '../errors'
import * as util from 'util'

import {ActionBase} from './action/base'
import {config, Config} from './config'
import {ExitError} from './exit'
import {IPromptOptions} from './prompt'
import * as styled from './styled'
import {Table} from './styled'
import * as uxPrompt from './prompt'
import uxWait from './wait'

const hyperlinker = require('hyperlinker')

function timeout(p: Promise<any>, ms: number) {
  function wait(ms: number, unref = false) {
    return new Promise(resolve => {
      const t: any = setTimeout(() => resolve(null), ms)
      if (unref) t.unref()
    })
  }

  return Promise.race([p, wait(ms, true).then(() => Errors.error('timed out'))])
}

async function _flush() {
  const p = new Promise(resolve => {
    process.stdout.once('drain', () => resolve(null))
  })
  const flushed = process.stdout.write('')

  if (flushed) {
    return Promise.resolve()
  }

  return p
}

export class ux {
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

  public static get prideAction(): ActionBase {
    return config.prideAction
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static styledObject(obj: any, keys?: string[]): void {
    this.info(styled.styledObject(obj, keys))
  }

  public static get styledHeader(): typeof styled.styledHeader {
    return styled.styledHeader
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
      process.stdout.write(util.format(format, ...args) + '\n')
    }
  }

  public static debug(format: string, ...args: string[]): void {
    if (['trace', 'debug'].includes(this.config.outputLevel)) {
      process.stdout.write(util.format(format, ...args) + '\n')
    }
  }

  public static info(format: string, ...args: string[]): void {
    process.stdout.write(util.format(format, ...args) + '\n')
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
    await timeout(_flush(), ms)
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
const prideAction = ux.prideAction
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
  ActionBase,
  annotation,
  anykey,
  config,
  Config,
  confirm,
  debug,
  done,
  error,
  exit,
  ExitError,
  flush,
  info,
  IPromptOptions,
  log,
  prideAction,
  progress,
  prompt,
  styledHeader,
  styledJSON,
  styledObject,
  table,
  Table,
  trace,
  tree,
  url,
  wait,
  warn,
}

const cliuxProcessExitHandler = async () => {
  try {
    await ux.done()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

// to avoid MaxListenersExceededWarning
// only attach named listener once
const cliuxListener = process.listeners('exit').find(fn => fn.name === cliuxProcessExitHandler.name)
if (!cliuxListener) {
  process.once('exit', cliuxProcessExitHandler)
}
