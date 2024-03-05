import chalk from 'chalk'
import {format as utilFormat} from 'node:util'

import * as Errors from '../errors'
import {ActionBase} from './action/base'
import {config} from './config'
import {flush as _flush} from './flush'
import * as uxPrompt from './prompt'
import * as styled from './styled'
import uxWait from './wait'
import write from './write'
const hyperlinker = require('hyperlinker')

export class ux {
  public static config = config

  public static get action(): ActionBase {
    return config.action
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

  /**
   * "press anykey to continue"
   */
  public static get anykey(): typeof uxPrompt.anykey {
    return uxPrompt.anykey
  }

  public static get confirm(): typeof uxPrompt.confirm {
    return uxPrompt.confirm
  }

  public static debug(format: string, ...args: string[]): void {
    if (['debug', 'trace'].includes(this.config.outputLevel)) {
      this.info(utilFormat(format, ...args) + '\n')
    }
  }

  public static async done(): Promise<void> {
    config.action.stop()
  }

  public static async flush(ms = 10_000): Promise<void> {
    await _flush(ms)
  }

  public static info(format: string, ...args: string[]): void {
    write.stdout(utilFormat(format, ...args) + '\n')
  }

  public static log(format?: string, ...args: string[]): void {
    this.info(format || '', ...args)
  }

  public static logToStderr(format?: string, ...args: string[]): void {
    write.stderr(utilFormat(format, ...args) + '\n')
  }

  public static get progress(): typeof styled.progress {
    return styled.progress
  }

  public static get prompt(): typeof uxPrompt.prompt {
    return uxPrompt.prompt
  }

  public static styledHeader(header: string): void {
    this.info(chalk.dim('=== ') + chalk.bold(header) + '\n')
  }

  public static styledJSON(obj: unknown): void {
    const json = JSON.stringify(obj, null, 2)
    if (!chalk.level) {
      this.info(json)
      return
    }

    const cardinal = require('cardinal')
    const theme = require('cardinal/themes/jq')
    this.info(cardinal.highlight(json, {json: true, theme}))
  }

  public static styledObject(obj: any, keys?: string[]): void {
    this.info(styled.styledObject(obj, keys))
  }

  public static get table(): typeof styled.Table.table {
    return styled.Table.table
  }

  public static trace(format: string, ...args: string[]): void {
    if (this.config.outputLevel === 'trace') {
      this.info(utilFormat(format, ...args) + '\n')
    }
  }

  public static get tree(): typeof styled.tree {
    return styled.tree
  }

  public static url(text: string, uri: string, params = {}): void {
    const supports = require('supports-hyperlinks')
    if (supports.stdout) {
      this.log(hyperlinker(text, uri, params))
    } else {
      this.log(uri)
    }
  }

  public static get wait(): typeof uxWait {
    return uxWait
  }
}

const {
  action,
  annotation,
  anykey,
  confirm,
  debug,
  done,
  flush,
  info,
  log,
  logToStderr,
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
} = ux

const {error, exit, warn} = Errors

export {
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  action,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  annotation,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  anykey,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  confirm,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  debug,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  done,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  error,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  exit,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  flush,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  info,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  log,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  logToStderr,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  progress,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  prompt,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  styledHeader,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  styledJSON,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  styledObject,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  table,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  trace,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  tree,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  url,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  wait,
  /**
   * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
   */
  warn,
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
const uxListener = process.listeners('exit').find((fn) => fn.name === uxProcessExitHandler.name)
if (!uxListener) {
  process.once('exit', uxProcessExitHandler)
}

export {ActionBase} from './action/base'
export {Config, config} from './config'
export {ExitError} from './exit'
export {IPromptOptions} from './prompt'
export {Table} from './styled'

export {colorize} from './theme'
export {default as write} from './write'
