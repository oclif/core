import {PJSON} from '../interfaces/pjson'
import {requireJson} from '../util/fs'
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
// eslint-disable-next-line logical-assignment-operators
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
  const major = requireJson<PJSON>(__dirname, '..', '..', 'package.json').version.split('.')[0]
  if (globals[major]) return globals[major]
  globals[major] = new Config()
  return globals[major]
}

export const config: Config = fetch()
export default config
