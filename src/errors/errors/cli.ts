import * as chalk from 'chalk'
import * as indent from 'indent-string'
import * as cs from 'clean-stack'
import * as wrap from 'wrap-ansi'

import * as screen from '../../screen'
import {config} from '../config'
import {PrettyPrintableError, OclifError} from '../../interfaces/errors'

/**
 * properties specific to internal oclif error handling
 */

export function addOclifExitCode(error: Record<string, any>, options?: { exit?: number | false }): OclifError {
  if (!('oclif' in error)) {
    (error as unknown as OclifError).oclif = {}
  }

  error.oclif.exit = options?.exit === undefined ? 2 : options.exit
  return error as OclifError
}

export class CLIError extends Error implements OclifError {
  oclif: OclifError['oclif'] = {}

  code?: string

  constructor(error: string | Error, options: { exit?: number | false } & PrettyPrintableError = {}) {
    super(error instanceof Error ? error.message : error)
    addOclifExitCode(this, options)
    this.code = options.code
  }

  get stack(): string {
    return cs(super.stack!, {pretty: true})
  }

  /**
   * @deprecated `render` Errors display should be handled by display function, like pretty-print
   * @return {string} returns a string representing the dispay of the error
   */
  render(): string {
    if (config.debug) {
      return this.stack
    }

    let output = `${this.name}: ${this.message}`
    output = wrap(output, screen.errtermwidth - 6, {trim: false, hard: true} as any)
    output = indent(output, 3)
    output = indent(output, 1, {indent: this.bang, includeEmptyLines: true} as any)
    output = indent(output, 1)
    return output
  }

  get bang() {
    try {
      return chalk.red(process.platform === 'win32' ? '»' : '›')
    } catch {}
  }
}

export namespace CLIError {
  export class Warn extends CLIError {
    constructor(err: string | Error) {
      super(err instanceof Error ? err.message : err)
      this.name = 'Warning'
    }

    get bang() {
      try {
        return chalk.yellow(process.platform === 'win32' ? '»' : '›')
      } catch {}
    }
  }
}
