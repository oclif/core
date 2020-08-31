import {expect, fancy} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'

import {config, warn} from '../../src/errors'

const errlog = path.join(__dirname, '../tmp/mytest/warn.log')

describe('warn', () => {
  fancy
  .stderr()
  .do(() => {
    config.errlog = errlog
  })
  .finally(() => {
    config.errlog = undefined
  })
  .it('warns', async ctx => {
    warn('foo!')
    expect(ctx.stderr).to.contain('Warning: foo!')
    expect(process.exitCode).to.be.undefined
    await config.errorLogger!.flush()
    expect(fs.readFileSync(errlog, 'utf8')).to.contain('Warning: foo!')
  })
})
