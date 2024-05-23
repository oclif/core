import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import {warn} from '../../src/errors'

describe('warn', () => {
  it('warns', async () => {
    const {stderr} = await captureOutput(async () => warn('foo!'))
    expect(stderr).to.contain('Warning: foo!')
  })
})
