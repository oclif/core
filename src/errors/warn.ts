import {OclifError} from '../interfaces'
import {getLogger} from '../logger'
import {stderr} from '../ux/write'
import {addOclifExitCode, CLIError} from './errors/cli'
import prettyPrint from './errors/pretty-print'

/**
 * Prints a pretty warning message to stderr.
 *
 * @param input The error or string to print.
 */
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
  if (message) stderr(message)
  if (err?.stack) getLogger().error(err.stack)
}

const WARNINGS = new Set<Error | string>()
export function memoizedWarn(input: Error | string): void {
  if (!WARNINGS.has(input)) warn(input)

  WARNINGS.add(input)
}

export default warn
