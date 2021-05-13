// tslint:disable no-console

export {handle} from './handle'
export {ExitError} from './errors/exit'
export {ModuleLoadError} from './errors/module-load'
export {CLIError} from './errors/cli'
export {Logger} from './logger'
export {config} from './config'

import {config} from './config'
import {CLIError, addOclifExitCode} from './errors/cli'
import {ExitError} from './errors/exit'
import prettyPrint, {applyPrettyPrintOptions} from './errors/pretty-print'
import {OclifError, PrettyPrintableError} from '../interfaces'

export {PrettyPrintableError}

export function exit(code = 0): never {
  throw new ExitError(code)
}

export function error(input: string | Error, options: {exit: false} & PrettyPrintableError): void
export function error(input: string | Error, options?: {exit?: number} & PrettyPrintableError): never
export function error(input: string | Error, options: {exit?: number | false} & PrettyPrintableError = {}) {
  let err: Error & OclifError

  if (typeof input === 'string') {
    err = new CLIError(input, options)
  } else if (input instanceof Error) {
    err = addOclifExitCode(input, options) as Error & OclifError
  } else {
    throw new TypeError('first argument must be a string or instance of Error')
  }

  err = applyPrettyPrintOptions(err, options) as Error & OclifError & PrettyPrintableError

  if (options.exit === false) {
    const message = prettyPrint(err)
    console.error(message)
    if (config.errorLogger) config.errorLogger.log(err?.stack ?? '')
  } else throw err
}

export function warn(input: string | Error) {
  let err: Error & OclifError

  if (typeof input === 'string') {
    err = new CLIError.Warn(input)
  } else if (input instanceof Error) {
    err = addOclifExitCode(input) as Error & OclifError
  } else {
    throw new TypeError('first argument must be a string or instance of Error')
  }

  const message = prettyPrint(err)
  console.error(message)
  if (config.errorLogger) config.errorLogger.log(err?.stack ?? '')
}
