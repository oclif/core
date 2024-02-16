import {expect} from 'chai'
import readline from 'node:readline'
import {SinonSandbox, createSandbox} from 'sinon'

import {ux} from '../../src/cli-ux'

describe('prompt', () => {
  let sandbox: SinonSandbox

  function stubReadline(answers: string[]) {
    let callCount = 0
    sandbox.stub(readline, 'createInterface').returns({
      // @ts-expect-error because we're stubbing
      async question(_message, opts, cb) {
        callCount += 1
        cb(answers[callCount - 1])
      },
      close() {},
    })
  }

  beforeEach(() => {
    sandbox = createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should require input', async () => {
    stubReadline(['', '', 'answer'])
    const answer = await ux.prompt('Require input?')
    expect(answer).to.equal('answer')
  })

  it('should not require input', async () => {
    stubReadline([''])
    const answer = await ux.prompt('Require input?', {required: false})
    expect(answer).to.equal('')
  })

  it('should use default input', async () => {
    stubReadline([''])
    const answer = await ux.prompt('Require input?', {default: 'default'})
    expect(answer).to.equal('default')
  })

  it('should confirm with y', async () => {
    stubReadline(['y'])
    const answer = await ux.confirm('yes/no?')
    expect(answer).to.equal(true)
  })

  it('should confirm with n', async () => {
    stubReadline(['n'])
    const answer = await ux.confirm('yes/no?')
    expect(answer).to.equal(false)
  })

  it('should get anykey', async () => {
    stubReadline(['x'])
    const answer = await ux.anykey()
    expect(answer).to.equal('x')
  })
})
