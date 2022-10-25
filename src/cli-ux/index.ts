import * as Errors from '../errors'
import * as util from 'util'

import {ActionBase} from './action/base'
import {config, Config} from './config'
// todo: get rid of this pattern
import deps from './deps'
import {ExitError} from './exit'
import {IPromptOptions} from './prompt'
import * as Table from './styled/table'

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

async function flush() {
  const p = new Promise(resolve => {
    process.stdout.once('drain', () => resolve(null))
  })
  const flushed = process.stdout.write('')

  if (flushed) {
    return Promise.resolve()
  }

  return p
}

export const ux = {
  config,

  warn: Errors.warn,
  error: Errors.error,
  exit: Errors.exit,

  get prompt(): typeof deps.prompt.prompt {
    return deps.prompt.prompt
  },
  /**
   * "press anykey to continue"
   */
  get anykey(): typeof deps.prompt.anykey {
    return deps.prompt.anykey
  },
  get confirm(): typeof deps.prompt.confirm {
    return deps.prompt.confirm
  },
  get action(): ActionBase {
    return config.action
  },
  get prideAction(): ActionBase {
    return config.prideAction
  },
  styledObject(obj: Record<string, unknown> | Array<Record<string, unknown>>, keys?: string[]): void {
    ux.info(deps.styledObject(obj, keys))
  },
  get styledHeader(): typeof deps.styledHeader {
    return deps.styledHeader
  },
  get styledJSON(): typeof deps.styledJSON {
    return deps.styledJSON
  },
  get table(): typeof deps.table {
    return deps.table
  },
  get tree(): typeof deps.tree {
    return deps.tree
  },
  get open(): typeof deps.open {
    return deps.open
  },
  get wait(): typeof deps.wait {
    return deps.wait
  },
  get progress(): typeof deps.progress {
    return deps.progress
  },

  async done(): Promise<void> {
    config.action.stop()
    // await flushStdout()
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
    await timeout(flush(), ms)
  },
}

export {
  config,
  ActionBase,
  Config,
  ExitError,
  IPromptOptions,
  Table,
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
