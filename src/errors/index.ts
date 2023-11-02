import write from '../cli-ux/write'
import {OclifError, PrettyPrintableError} from '../interfaces'
import {config} from './config'
import {CLIError, addOclifExitCode} from './errors/cli'
import {ExitError} from './errors/exit'
import prettyPrint, {applyPrettyPrintOptions} from './errors/pretty-print'

export {PrettyPrintableError} from '../interfaces'
export {config} from './config'
export {CLIError} from './errors/cli'
export {ExitError} from './errors/exit'
export {ModuleLoadError} from './errors/module-load'
export {handle} from './handle'

export function exit(code = 0): never {
  throw new ExitError(code)
}

export function error(input: Error | string, options: {exit: false} & PrettyPrintableError): void
export function error(input: Error | string, options?: {exit?: number} & PrettyPrintableError): never
export function error(input: Error | string, options: {exit?: false | number} & PrettyPrintableError = {}): void {
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
    if (message) write.stderr(message + '\n')
    if (config.errorLogger) config.errorLogger.log(err?.stack ?? '')
  } else throw err
}

export function warn(input: Error | string): void {
  let err: Error & OclifError

  if (typeof input === 'string') {
    err = new CLIError.Warn(input)
  } else if (input instanceof Error) {
    err = addOclifExitCode(input) as Error & OclifError
  } else {
    throw new TypeError('first argument must be a string or instance of Error')
  }

  const message = prettyPrint(err)
  if (message) write.stderr(message + '\n')
  if (config.errorLogger) config.errorLogger.log(err?.stack ?? '')
}

const WARNINGS = new Set<Error | string>()
export function memoizedWarn(input: Error | string): void {
  if (!WARNINGS.has(input)) warn(input)

  WARNINGS.add(input)
}

export {Logger} from './logger'
