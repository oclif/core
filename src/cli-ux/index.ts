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

  return Promise.race([p, wait(ms, true).then(() => ux.error('timed out'))])
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

const ux = {
  config,

  warn: Errors.warn,
  error: Errors.error,
  exit: Errors.exit,

  get prompt(): typeof uxPrompt.prompt {
    return uxPrompt.prompt
  },
  /**
   * "press anykey to continue"
   */
  get anykey(): typeof uxPrompt.anykey {
    return uxPrompt.anykey
  },
  get confirm(): typeof uxPrompt.confirm {
    return uxPrompt.confirm
  },
  get action(): ActionBase {
    return config.action
  },
  get prideAction(): ActionBase {
    return config.prideAction
  },
  styledObject(obj: any, keys?: string[]): void {
    ux.info(styled.styledObject(obj, keys))
  },
  get styledHeader(): typeof styled.styledHeader {
    return styled.styledHeader
  },
  get styledJSON(): typeof styled.styledJSON {
    return styled.styledJSON
  },
  get table(): typeof styled.Table.table {
    return styled.Table.table
  },
  get tree(): typeof styled.tree {
    return styled.tree
  },
  get wait(): typeof uxWait {
    return uxWait
  },
  get progress(): typeof styled.progress {
    return styled.progress
  },

  async done(): Promise<void> {
    config.action.stop()
  },

  trace(format: string, ...args: string[]): void {
    if (this.config.outputLevel === 'trace') {
      process.stdout.write(util.format(format, ...args) + '\n')
    }
  },

  debug(format: string, ...args: string[]): void {
    if (['trace', 'debug'].includes(this.config.outputLevel)) {
      process.stdout.write(util.format(format, ...args) + '\n')
    }
  },

  info(format: string, ...args: string[]): void {
    process.stdout.write(util.format(format, ...args) + '\n')
  },

  log(format?: string, ...args: string[]): void {
    this.info(format || '', ...args)
  },

  url(text: string, uri: string, params = {}): void {
    const supports = require('supports-hyperlinks')
    if (supports.stdout) {
      this.log(hyperlinker(text, uri, params))
    } else {
      this.log(uri)
    }
  },

  annotation(text: string, annotation: string): void {
    const supports = require('supports-hyperlinks')
    if (supports.stdout) {
      // \u001b]8;;https://google.com\u0007sometext\u001b]8;;\u0007
      this.log(`\u001B]1337;AddAnnotation=${text.length}|${annotation}\u0007${text}`)
    } else {
      this.log(text)
    }
  },

  async flush(ms = 10_000): Promise<void> {
    await timeout(_flush(), ms)
  },
}

const action = ux.action
const annotation = ux.annotation.bind(ux)
const anykey = ux.anykey.bind(ux)
const confirm = ux.confirm.bind(ux)
const debug = ux.debug.bind(ux)
const done = ux.done.bind(ux)
const error = ux.error.bind(ux)
const exit = ux.exit.bind(ux)
const flush = ux.flush.bind(ux)
const info = ux.info.bind(ux)
const log = ux.log.bind(ux)
const prideAction = ux.prideAction
const progress = ux.progress.bind(ux)
const prompt = ux.prompt.bind(ux)
const styledHeader = ux.styledHeader.bind(ux)
const styledJSON = ux.styledJSON.bind(ux)
const styledObject = ux.styledObject.bind(ux)
const table = ux.table
const trace = ux.trace.bind(ux)
const tree = ux.tree.bind(ux)
const url = ux.url.bind(ux)
const wait = ux.wait.bind(ux)
const warn = ux.warn.bind(ux)

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
