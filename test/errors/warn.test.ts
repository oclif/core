import {expect} from 'chai'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'

import {config, warn} from '../../src/errors'
import {captureOutput} from '../test'

const errlog = join(__dirname, '../tmp/mytest/warn.log')

describe('warn', () => {
  beforeEach(() => {
    config.errlog = errlog
  })

  afterEach(() => {
    config.errlog = undefined
  })

  it('warns', async () => {
    const {stderr} = await captureOutput(async () => warn('foo!'))
    expect(stderr).to.contain('Warning: foo!')
    await config.errorLogger!.flush()
    expect(await readFile(errlog, 'utf8')).to.contain('Warning: foo!')
  })
})
