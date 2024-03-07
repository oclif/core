import write from '../cli-ux/write'
import {OclifError} from '../interfaces'
import {config} from './config'
import {CLIError, addOclifExitCode} from './errors/cli'
import prettyPrint from './errors/pretty-print'

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

export default warn
