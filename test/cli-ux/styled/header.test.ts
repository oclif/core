import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import {ux} from '../../../src/cli-ux'

describe('styled/header', () => {
  let writeStub: SinonStub

  beforeEach(() => {
    writeStub = stub(ux, 'info')
  })

  afterEach(() => {
    writeStub.restore()
  })

  it('shows a styled header', () => {
    ux.styledHeader('A styled header')
    expect(writeStub.firstCall.firstArg).to.include('=== A styled header\n')
  })
})
