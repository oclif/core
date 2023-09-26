import chalk from 'chalk'
import {format} from 'node:util'
import {stdout} from '../stream'

const info = (output: string) => stdout.write(format(output) + '\n')

export default function styledJSON(obj: unknown): void {
  const json = JSON.stringify(obj, null, 2)
  if (!chalk.level) {
    info(json)
    return
  }

  const cardinal = require('cardinal')
  const theme = require('cardinal/themes/jq')
  info(cardinal.highlight(json, {json: true, theme}))
}
