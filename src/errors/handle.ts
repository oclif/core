/* eslint-disable no-process-exit */
/* eslint-disable unicorn/no-process-exit */
import {OclifError, PrettyPrintableError} from '../interfaces'
import {CLIError} from './errors/cli'
import {ExitError} from '.'
import clean from 'clean-stack'
import {config} from './config'
import prettyPrint from './errors/pretty-print'

/**
 * This is an odd abstraction for process.exit, but it allows us to stub it in tests.
 *
 * https://github.com/sinonjs/sinon/issues/562
 */
export const Exit = {
  exit(code = 0) {
    process.exit(code)
  },
}

export async function handle(err: Error & Partial<PrettyPrintableError> & Partial<OclifError> & {skipOclifErrorHandling?: boolean}): Promise<void> {
  try {
    if (!err) err = new CLIError('no error?')
    if (err.message === 'SIGINT') Exit.exit(1)

    const shouldPrint = !(err instanceof ExitError) && !err.skipOclifErrorHandling
    const pretty = prettyPrint(err)
    const stack = clean(err.stack || '', {pretty: true})

    if (shouldPrint) {
      console.error(pretty ?? stack)
    }

    const exitCode = err.oclif?.exit !== undefined && err.oclif?.exit !== false ? err.oclif?.exit : 1

    if (config.errorLogger && err.code !== 'EEXIT') {
      if (stack) {
        config.errorLogger.log(stack)
      }

      await config.errorLogger.flush()
      .then(() => Exit.exit(exitCode))
      .catch(console.error)
    } else Exit.exit(exitCode)
  } catch (error: any) {
    console.error(err.stack)
    console.error(error.stack)
    Exit.exit(1)
  }
}
