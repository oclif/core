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

/**
 * Cache of logger instances. This is used to prevent creating multiple logger instances for the same namespace.
 *
 * The root logger is stored under the 'root' key as well as it's namespace.
 */
const cachedLoggers = new Map<string, Logger>()

/**
 * Returns a logger instance for the given namespace.
 * If a namespace is provided, a child logger is returned.
 * If no namespace is provided, the root logger is returned.
 */
export function getLogger(namespace?: string): Logger {
  let rootLogger = cachedLoggers.get('root')
  if (!rootLogger) {
    set(makeLogger(OCLIF_NS))
  }

  rootLogger = cachedLoggers.get('root')!

  if (namespace) {
    const cachedLogger = cachedLoggers.get(namespace)
    if (cachedLogger) return cachedLogger

    const logger = rootLogger.child(namespace)
    cachedLoggers.set(namespace, logger)
    return logger
  }

  return rootLogger
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
  if (cachedLoggers.has(newLogger.namespace)) return
  if (cachedLoggers.has('root')) return

  if (ensureItMatchesInterface(newLogger)) {
    cachedLoggers.set(newLogger.namespace, newLogger)
    cachedLoggers.set('root', newLogger)
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

export function clearLoggers() {
  cachedLoggers.clear()
}
