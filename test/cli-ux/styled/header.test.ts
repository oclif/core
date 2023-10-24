import {expect} from 'chai'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'
import stripAnsi from 'strip-ansi'

import {ux} from '../../../src'

describe('styled/header', () => {
  let sandbox: SinonSandbox
  let stdoutStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    stdoutStub = sandbox.stub(ux.write, 'stdout')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('shows a styled header', () => {
    ux.styledHeader('A styled header')
    expect(stripAnsi(stdoutStub.firstCall.firstArg)).to.include('=== A styled header\n')
  })
})
