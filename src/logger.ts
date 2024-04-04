import makeDebugger from 'debug'

import {LoadOptions} from './interfaces/config'
import {Logger} from './interfaces/logger'

const OCLIF_NS = 'oclif'

function makeLogger(namespace: string = OCLIF_NS): Logger {
  const debug = makeDebugger(namespace)
  return {
    child: (ns: string, delimiter?: string) => makeLogger(`${namespace}${delimiter ?? ':'}${ns}`),
    debug,
    error: (formatter: unknown, ...args: unknown[]) => makeLogger(`${namespace}:error`).debug(formatter, ...args),
    info: debug,
    namespace,
    trace: debug,
    warn: debug,
  }
}

let cachedLogger: Logger | undefined

export function getLogger(namespace?: string): Logger {
  if (!cachedLogger) {
    cachedLogger = makeLogger(OCLIF_NS)
  }

  return namespace && cachedLogger.namespace !== namespace ? cachedLogger.child(namespace) : cachedLogger
}

function ensureItMatchesInterface(newLogger: Logger): boolean {
  return (
    typeof newLogger.child === 'function' &&
    typeof newLogger.debug === 'function' &&
    typeof newLogger.error === 'function' &&
    typeof newLogger.info === 'function' &&
    typeof newLogger.trace === 'function' &&
    typeof newLogger.warn === 'function' &&
    typeof newLogger.namespace === 'string'
  )
}

function set(newLogger: Logger): void {
  if (cachedLogger) return

  if (ensureItMatchesInterface(newLogger)) {
    cachedLogger = newLogger
  } else {
    process.emitWarning('Logger does not match the Logger interface. Using default logger.')
  }
}

/**
 * Convenience function to create a debug function for a specific namespace
 */
export function makeDebug(namespace: string): Logger['debug'] {
  return (formatter: unknown, ...args: unknown[]) => getLogger(namespace).debug(formatter, ...args)
}

export function setLogger(loadOptions: LoadOptions) {
  if (loadOptions && typeof loadOptions !== 'string' && 'logger' in loadOptions && loadOptions.logger) {
    set(loadOptions.logger)
  } else {
    set(makeLogger(OCLIF_NS))
  }
}
