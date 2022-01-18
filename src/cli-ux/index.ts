import * as Errors from '../errors'
import * as util from 'util'

import * as uxConfig from './config'
import deps from './deps'
import * as Table from './styled/table'
import {CliUx as BaseCliUx} from './action/base'

const hyperlinker = require('hyperlinker')

function timeout(p: Promise<any>, ms: number) {
  function wait(ms: number, unref = false) {
    return new Promise(resolve => {
      const t: any = setTimeout(() => resolve(null), ms)
      if (unref) t.unref()
    })
  }

  return Promise.race([p, wait(ms, true).then(() => CliUx.ux.error('timed out'))])
}

async function flush() {
  const p = new Promise(resolve => {
    process.stdout.once('drain', () => resolve(null))
  })
  process.stdout.write('')
  return p
}

export namespace CliUx {
  export const ux = {
    config: uxConfig.CliUx.config,
    warn: Errors.warn,
    error: Errors.error,
    exit: Errors.exit,

    get prompt() {
      return deps.prompt.CliUx.prompt
    },
    /**
   * "press anykey to continue"
   */
    get anykey() {
      return deps.prompt.CliUx.anykey
    },
    get confirm() {
      return deps.prompt.CliUx.confirm
    },
    get action() {
      return uxConfig.CliUx.config.action
    },
    get prideAction() {
      return uxConfig.CliUx.config.prideAction
    },
    styledObject(obj: any, keys?: string[]) {
      ux.info(deps.styledObject(obj, keys))
    },
    get styledHeader() {
      return deps.styledHeader
    },
    get styledJSON() {
      return deps.styledJSON
    },
    get table() {
      return deps.table
    },
    get tree() {
      return deps.tree
    },
    get open() {
      return deps.open
    },
    get wait() {
      return deps.wait
    },
    get progress() {
      return deps.progress
    },

    async done() {
      uxConfig.CliUx.config.action.stop()
      // await flushStdout()
    },

    trace(format: string, ...args: string[]) {
      if (this.config.outputLevel === 'trace') {
        process.stdout.write(util.format(format, ...args) + '\n')
      }
    },

    debug(format: string, ...args: string[]) {
      if (['trace', 'debug'].includes(this.config.outputLevel)) {
        process.stdout.write(util.format(format, ...args) + '\n')
      }
    },

    info(format: string, ...args: string[]) {
      process.stdout.write(util.format(format, ...args) + '\n')
    },

    log(format?: string, ...args: string[]) {
      this.info(format || '', ...args)
    },

    url(text: string, uri: string, params = {}) {
      const supports = require('supports-hyperlinks')
      if (supports.stdout) {
        this.log(hyperlinker(text, uri, params))
      } else {
        this.log(uri)
      }
    },

    annotation(text: string, annotation: string) {
      const supports = require('supports-hyperlinks')
      if (supports.stdout) {
        // \u001b]8;;https://google.com\u0007sometext\u001b]8;;\u0007
        this.log(`\u001B]1337;AddAnnotation=${text.length}|${annotation}\u0007${text}`)
      } else {
        this.log(text)
      }
    },

    async flush() {
      await timeout(flush(), 10_000)
    },
  }
}

export {
  Table,
}

export namespace CliUx {
  export const cli = ux
}

const cliuxProcessExitHandler = async () => {
  try {
    await CliUx.ux.done()
  } catch (error) {
    // tslint:disable no-console
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
