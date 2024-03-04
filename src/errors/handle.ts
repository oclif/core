/* eslint-disable no-process-exit */
import clean from 'clean-stack'

/* eslint-disable unicorn/no-process-exit */
import {OclifError, PrettyPrintableError} from '../interfaces'
import {config} from './config'
import {CLIError} from './errors/cli'
import {ExitError} from './errors/exit'
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

type ErrorToHandle = Error & Partial<PrettyPrintableError> & Partial<OclifError> & {skipOclifErrorHandling?: boolean}

export async function handle(err: ErrorToHandle): Promise<void> {
  try {
    err ||= new CLIError('no error?')
    if (err.message === 'SIGINT') Exit.exit(1)

    const shouldPrint = !(err instanceof ExitError) && !err.skipOclifErrorHandling
    const pretty = prettyPrint(err)
    const stack = clean(err.stack || '', {pretty: true})

    if (shouldPrint) {
      console.error(pretty ?? stack)
    }

    const exitCode = err.oclif?.exit ?? 1

    if (config.errorLogger && err.code !== 'EEXIT') {
      if (stack) {
        config.errorLogger.log(stack)
      }

      await config.errorLogger
        .flush()
        .then(() => Exit.exit(exitCode))
        .catch(console.error)
    } else Exit.exit(exitCode)
  } catch (error: any) {
    console.error(err.stack)
    console.error(error.stack)
    Exit.exit(1)
  }
}
