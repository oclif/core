/* eslint-disable no-process-exit */
/* eslint-disable unicorn/no-process-exit */
import {config} from './config'
import prettyPrint from './errors/pretty-print'
import {ExitError} from '.'
import clean = require('clean-stack')
import {CLIError} from './errors/cli'
import {OclifError, PrettyPrintableError} from '../interfaces'

export const handle = (err: Error & Partial<PrettyPrintableError> & Partial<OclifError>) => {
  try {
    if (!err) err = new CLIError('no error?')
    if (err.message === 'SIGINT') process.exit(1)

    const shouldPrint = !(err instanceof ExitError)
    const pretty = prettyPrint(err)
    const stack = clean(err.stack || '', {pretty: true})

    if (shouldPrint) {
      console.error(pretty ? pretty : stack)
    }

    const exitCode = err.oclif?.exit !== undefined && err.oclif?.exit !== false ? err.oclif?.exit : 1

    if (config.errorLogger && err.code !== 'EEXIT') {
      if (stack) {
        config.errorLogger.log(stack)
      }

      config.errorLogger.flush()
      .then(() => process.exit(exitCode))
      .catch(console.error)
    } else process.exit(exitCode)
  } catch (error: any) {
    console.error(err.stack)
    console.error(error.stack)
    process.exit(1)
  }
}
