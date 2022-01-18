import * as semver from 'semver'

import {CliUx as AB} from './action/base'

const version = semver.parse(require('../../package.json').version)!

export type Levels = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

export namespace CliUx {
  export interface ConfigMessage {
    type: 'config';
    prop: string;
    value: any;
  }
}
const g: any = global
const globals = g['cli-ux'] || (g['cli-ux'] = {})

const actionType = (
  Boolean(process.stderr.isTTY) &&
  !process.env.CI &&
  !['dumb', 'emacs-color'].includes(process.env.TERM!) &&
  'spinner'
) || 'simple'

/* eslint-disable node/no-missing-require */
const Action = actionType === 'spinner' ? require('./action/spinner').default : require('./action/simple').default
const PrideAction = actionType === 'spinner' ? require('./action/pride-spinner').default : require('./action/simple').default
/* eslint-enable node/no-missing-require */

export namespace CliUx {
  export class Config {
    outputLevel: Levels = 'info'

    action: AB.ActionBase = new Action()

    prideAction: AB.ActionBase = new PrideAction()

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

    set context(v: any) {
      globals.context = v
    }
  }
}
function fetch() {
  if (globals[version.major]) return globals[version.major]
  globals[version.major] = new CliUx.Config()
  return globals[version.major]
}

export namespace CliUx {
  export const config: Config = fetch()
}
