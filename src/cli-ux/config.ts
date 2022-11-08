import * as semver from 'semver'
import {PJSON} from '../interfaces/pjson'
import {requireJson} from '../util'
import spinner from './action/spinner'
import simple from './action/spinner'
import pride from './action/pride-spinner'
import {ActionBase} from './action/base'

const version = semver.parse(requireJson<PJSON>(__dirname, '..', '..', 'package.json').version)!

export type Levels = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

export interface ConfigMessage {
  type: 'config';
  prop: string;
  value: any;
}

const g: any = global
const globals = g['cli-ux'] || (g['cli-ux'] = {})

const actionType = (
  Boolean(process.stderr.isTTY) &&
  !process.env.CI &&
  !['dumb', 'emacs-color'].includes(process.env.TERM!) &&
  'spinner'
) || 'simple'

const Action = actionType === 'spinner' ? spinner : simple
const PrideAction = actionType === 'spinner' ? pride : simple

export class Config {
  outputLevel: Levels = 'info'

  action: ActionBase = new Action()

  prideAction: ActionBase = new PrideAction()

  errorsHandled = false

  showStackTrace = true

  get debug(): boolean {
    return globals.debug || process.env.DEBUG === '*'
  }

  set debug(v: boolean) {
    globals.debug = v
  }

  get context(): any {
    return globals.context || {}
  }

  set context(v: unknown) {
    globals.context = v
  }
}

function fetch() {
  if (globals[version.major]) return globals[version.major]
  globals[version.major] = new Config()
  return globals[version.major]
}

export const config: Config = fetch()
export default config
