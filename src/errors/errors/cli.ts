import ansis from 'ansis'
import cs from 'clean-stack'
import indent from 'indent-string'
import wrap from 'wrap-ansi'

import Cache from '../../cache'
import {OclifError, PrettyPrintableError} from '../../interfaces/errors'
import {errtermwidth} from '../../screen'
import {settings} from '../../settings'

/**
 * properties specific to internal oclif error handling
 */

export function addOclifExitCode(
  error: Record<string, any>,
  options?: {exit?: false | number | undefined},
): OclifError {
  if (!('oclif' in error)) {
    ;(error as unknown as OclifError).oclif = {}
  }

  error.oclif.exit = options?.exit === undefined ? Cache.getInstance().get('exitCodes')?.default ?? 2 : options.exit
  return error as OclifError
}

export class CLIError extends Error implements OclifError {
  code?: string | undefined
  oclif: OclifError['oclif'] = {}
  skipOclifErrorHandling?: boolean | undefined
  suggestions?: string[] | undefined

  constructor(error: Error | string, options: {exit?: false | number | undefined} & PrettyPrintableError = {}) {
    super(error instanceof Error ? error.message : error)
    addOclifExitCode(this, options)
    this.code = options.code
    this.suggestions = options.suggestions
  }

  get bang(): string | undefined {
    try {
      return ansis.red(process.platform === 'win32' ? '»' : '›')
    } catch {}
  }

  get stack(): string {
    return cs(super.stack!, {pretty: true})
  }

  /**
   * @deprecated `render` Errors display should be handled by display function, like pretty-print
   * @return {string} returns a string representing the dispay of the error
   */
  render(): string {
    if (settings.debug) {
      return this.stack
    }

    let output = `${this.name}: ${this.message}`
    output = wrap(output, errtermwidth - 6, {hard: true, trim: false} as any)
    output = indent(output, 3)
    output = indent(output, 1, {includeEmptyLines: true, indent: this.bang} as any)
    output = indent(output, 1)
    return output
  }
}

export namespace CLIError {
  export class Warn extends CLIError {
    constructor(err: Error | string) {
      super(err instanceof Error ? err.message : err)
      this.name = 'Warning'
    }

    get bang(): string | undefined {
      try {
        return ansis.yellow(process.platform === 'win32' ? '»' : '›')
      } catch {}
    }
  }
}
