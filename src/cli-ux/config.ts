import Cache from '../cache'
import {ActionBase} from './action/base'
import simple from './action/simple'
import spinner from './action/spinner'

export type Levels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn'

export interface ConfigMessage {
  prop: string
  type: 'config'
  value: any
}

const g: any = global
const globals = g.ux || (g.ux = {})

const actionType =
  (Boolean(process.stderr.isTTY) &&
    !process.env.CI &&
    !['dumb', 'emacs-color'].includes(process.env.TERM!) &&
    'spinner') ||
  'simple'

const Action = actionType === 'spinner' ? spinner : simple

export class Config {
  action: ActionBase = new Action()

  errorsHandled = false

  outputLevel: Levels = 'info'

  showStackTrace = true

  get context(): any {
    return globals.context || {}
  }

  set context(v: unknown) {
    globals.context = v
  }

  get debug(): boolean {
    return globals.debug || process.env.DEBUG === '*'
  }

  set debug(v: boolean) {
    globals.debug = v
  }
}

function fetch() {
  const core = Cache.getInstance().get('@oclif/core')
  const major = core?.version.split('.')[0] || 'unknown'
  if (globals[major]) return globals[major]
  globals[major] = new Config()
  return globals[major]
}

export const config: Config = fetch()
export default config
