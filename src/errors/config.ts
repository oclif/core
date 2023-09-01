import {settings} from '../settings'
import {Logger} from './logger'

function displayWarnings() {
  if (process.listenerCount('warning') > 1) return
  process.on('warning', (warning: any) => {
    console.error(warning.stack)
    if (warning.detail) console.error(warning.detail)
  })
}

export const config = {
  errorLogger: undefined as Logger | undefined,
  get debug(): boolean {
    return Boolean(settings.debug)
  },
  set debug(enabled: boolean) {
    settings.debug = enabled
    if (enabled) displayWarnings()
  },
  get errlog(): string | undefined {
    return settings.errlog
  },
  set errlog(errlog: string | undefined) {
    if (errlog) {
      this.errorLogger = new Logger(errlog)
      settings.errlog = errlog
    } else {
      delete this.errorLogger
      delete settings.errlog
    }
  },
}
