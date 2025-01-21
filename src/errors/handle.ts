import clean from 'clean-stack'

import Cache from '../cache'
import {Help} from '../help/index'
import {OclifError, PrettyPrintableError} from '../interfaces'
import {getLogger} from '../logger'
import {CLIParseError} from '../parser/errors'
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
    // eslint-disable-next-line n/no-process-exit
    process.exit(code)
  },
}

type ErrorToHandle = Error &
  Partial<PrettyPrintableError> &
  Partial<OclifError> &
  Partial<CLIError> &
  Partial<CLIParseError>

export async function handle(err: ErrorToHandle): Promise<void> {
  try {
    if (!err) err = new CLIError('no error?')
    if (err.message === 'SIGINT') Exit.exit(1)

    const shouldPrint = !(err instanceof ExitError) && !err.skipOclifErrorHandling
    const pretty = prettyPrint(err)
    const stack = clean(err.stack || '', {pretty: true})

    if (shouldPrint) {
      console.error(pretty ?? stack)
      const config = Cache.getInstance().get('config')
      if (err.showHelp && err.parse?.input?.argv && config) {
        const options = {
          ...(config.pjson.oclif.helpOptions ?? config.pjson.helpOptions),
          sections: ['flags', 'usage', 'arguments'],
          sendToStderr: true,
        }
        const help = new Help(config, options)
        console.error()
        await help.showHelp(process.argv.slice(2))
      }
    }

    const exitCode = err.oclif?.exit ?? 1

    if (err.code !== 'EEXIT' && stack) {
      getLogger().error(stack)
    }

    Exit.exit(exitCode)
  } catch (error: any) {
    console.error(err.stack)
    console.error(error.stack)
    Exit.exit(1)
  }
}
