import * as chalk from 'chalk'

import {ux} from '../index'

export default function styledJSON(obj: unknown): void {
  const json = JSON.stringify(obj, null, 2)
  if (!chalk.level) {
    ux.info(json)
    return
  }

  const cardinal = require('cardinal')
  const theme = require('cardinal/themes/jq')
  ux.info(cardinal.highlight(json, {json: true, theme}))
}
