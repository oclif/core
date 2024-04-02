import {OclifError} from '../interfaces'
import {stderr} from '../ux/write'
import {config} from './config'
import {CLIError, addOclifExitCode} from './errors/cli'
import prettyPrint from './errors/pretty-print'

const WARNINGS = new Set<Error | string>()

/**
 * Prints a pretty warning message to stderr.
 */
export function warn(input: Error | string, options?: {ignoreDuplicates: boolean}): void {
  const ignoreDuplicates = options?.ignoreDuplicates ?? true
  if (ignoreDuplicates && WARNINGS.has(input)) return
  WARNINGS.add(input)

  let err: Error & OclifError

  if (typeof input === 'string') {
    err = new CLIError.Warn(input)
  } else if (input instanceof Error) {
    err = addOclifExitCode(input) as Error & OclifError
  } else {
    throw new TypeError('first argument must be a string or instance of Error')
  }

  const message = prettyPrint(err)
  if (message) stderr(message)
  if (config.errorLogger) config.errorLogger.log(err?.stack ?? '')
}

export default warn
