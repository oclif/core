import {OclifError} from '../interfaces'
import {getLogger} from '../logger'
import {stderr} from '../ux/write'
import {CLIError, addOclifExitCode} from './errors/cli'
import prettyPrint from './errors/pretty-print'

const WARNINGS = new Set<Error | string>()

type Options = {
  /**
   * If true, will only print the same warning once.
   */
  ignoreDuplicates?: boolean
}

/**
 * Prints a pretty warning message to stderr.
 *
 * @param input The error or string to print.
 * @param options.ignoreDuplicates If true, will only print the same warning once.
 */
export function warn(input: Error | string, options?: Options): void {
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
  if (err?.stack) getLogger().error(err.stack)
}

export default warn
