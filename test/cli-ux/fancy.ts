import {expect, fancy as base, FancyTypes} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'

import cli from '../../src/cli-ux'

export {
  expect,
  FancyTypes,
}

let count = 0

export const fancy = base
.do(async (ctx: {count: number; base: string}) => {
  ctx.count = count++
  ctx.base = path.join(__dirname, '../tmp', `test-${ctx.count}`)
  await fs.remove(ctx.base)
  const chalk = require('chalk')
  chalk.level = 0
})
.finally(async () => {
  await cli.done()
})
