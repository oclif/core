import write from '../cli-ux/write'
import {OclifError, PrettyPrintableError} from '../interfaces'
import {config} from './config'
import {CLIError, addOclifExitCode} from './errors/cli'
import prettyPrint, {applyPrettyPrintOptions} from './errors/pretty-print'

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

export default error
