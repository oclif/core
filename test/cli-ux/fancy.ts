import {fancy as base} from 'fancy-test'
import {rm} from 'node:fs/promises'
import {join} from 'node:path'

import {ux} from '../../src/cli-ux'

let count = 0

export const fancy = base
  .do(async (ctx: {count: number; base: string}) => {
    ctx.count = count++
    ctx.base = join(__dirname, '../tmp', `test-${ctx.count}`)
    await rm(ctx.base, {recursive: true, force: true})
    const chalk = require('chalk')
    chalk.level = 0
  })
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .finally(async () => {
    await ux.done()
  })

export {FancyTypes, expect} from 'fancy-test'
