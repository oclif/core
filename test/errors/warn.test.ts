import {expect} from 'chai'

import {warn} from '../../src/errors'
import {captureOutput} from '../test'

describe('warn', () => {
  it('warns', async () => {
    const {stderr} = await captureOutput(async () => warn('foo!'))
    expect(stderr).to.contain('Warning: foo!')
  })
})
