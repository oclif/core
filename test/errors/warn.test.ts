import {expect, fancy} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'

import {config, warn} from '../../src/errors'

const errlog = path.join(__dirname, '../tmp/mytest/error.log')

describe.skip('warn', () => {
  fancy
  .stderr()
  .stdout()
  .do(() => {
    config.errlog = errlog
  })
  .finally(() => {
    config.errlog = undefined
  })
  .it('warns', async ctx => {
    warn('foo!')
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.contain('Warning: foo!')
    expect(process.exitCode).to.be.undefined
    await config.errorLogger!.flush()
    expect(fs.readFileSync(errlog, 'utf8')).to.contain('Warning: foo!')
  })
})
