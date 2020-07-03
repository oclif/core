// tslint:disable no-console
let debug: any
try {
  debug = require('debug')
} catch {}

function displayWarnings() {
  if (process.listenerCount('warning') > 1) return
  process.on('warning', (warning: any) => {
    console.error(warning.stack)
    if (warning.detail) console.error(warning.detail)
  })
}

export default (...scope: string[]) => {
  if (!debug) return (..._: any[]) => {}
  const d = debug(['@oclif/config', ...scope].join(':'))
  if (d.enabled) displayWarnings()
  return (...args: any[]) => d(...args)
}
