// tslint:disable restrict-plus-operands

import * as chalk from 'chalk'

import {CliUx} from '../../index'

export default function styledJSON(obj: any) {
  const json = JSON.stringify(obj, null, 2)
  if (!chalk.level) {
    CliUx.ux.info(json)
    return
  }

  const cardinal = require('cardinal')
  const theme = require('cardinal/themes/jq')
  CliUx.ux.info(cardinal.highlight(json, {json: true, theme}))
}
