import {expect} from 'chai'

import {stdout} from '../../../src'
import {stub, SinonStub} from 'sinon'
import ux from '../../../src/cli-ux'

describe('styled/header', () => {
  let writeStub: SinonStub

  beforeEach(() => {
    writeStub = stub(stdout, 'write')
  })

  afterEach(() => {
    writeStub.restore()
  })

  it('shows a styled header', () => {
    ux.styledHeader('A styled header')
    expect(writeStub.firstCall.firstArg).to.equal('=== A styled header\n\n')
  })
})
