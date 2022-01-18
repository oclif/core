// tslint:disable restrict-plus-operands

import * as chalk from 'chalk'

import {CliUx} from '..'

export default function styledJSON(obj: any) {
  const json = JSON.stringify(obj, null, 2)
  if (!chalk.level) {
    CliUx.cli.info(json)
    return
  }

  const cardinal = require('cardinal')
  const theme = require('cardinal/themes/jq')
  CliUx.cli.info(cardinal.highlight(json, {json: true, theme}))
}
