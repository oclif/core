import {expect} from 'chai'
import {SinonSandbox, createSandbox} from 'sinon'

import {ux} from '../../../src'

describe('styled/header', () => {
  let sandbox: SinonSandbox
  let stubs: ReturnType<typeof ux.makeStubs>

  beforeEach(() => {
    sandbox = createSandbox()
    stubs = ux.makeStubs(sandbox)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('shows a styled header', () => {
    ux.styledHeader('A styled header')
    expect(stubs.stdout.firstCall.firstArg).to.include('=== A styled header\n')
  })
})
