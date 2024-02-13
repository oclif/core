import {expect} from 'chai'
import {resolve} from 'node:path'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'
import stripAnsi from 'strip-ansi'

import {run, ux} from '../../src/index'

describe('single command cli', () => {
  let sandbox: SinonSandbox
  let stdoutStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    stdoutStub = sandbox.stub(ux.write, 'stdout')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should show help for commands', async () => {
    await run(['--help'], resolve(__dirname, 'fixtures/single-cmd-cli/package.json'))
    expect(stdoutStub.args.map((a) => stripAnsi(a[0])).join('')).to.equal(`Description of single command CLI.

USAGE
  $ single-cmd-cli

DESCRIPTION
  Description of single command CLI.

`)
  })

  it('should run command', async () => {
    await run([], resolve(__dirname, 'fixtures/single-cmd-cli/package.json'))
    expect(stdoutStub.firstCall.firstArg).to.equal('hello world!\n')
  })
})

describe('single command cli (deprecated)', () => {
  let sandbox: SinonSandbox
  let stdoutStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    stdoutStub = sandbox.stub(ux.write, 'stdout')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should show help for commands', async () => {
    await run(['--help'], resolve(__dirname, 'fixtures/single-cmd-cli-deprecated/package.json'))
    expect(stdoutStub.args.map((a) => stripAnsi(a[0])).join('')).to.equal(`Description of single command CLI.

USAGE
  $ single-cmd-cli

DESCRIPTION
  Description of single command CLI.

`)
  })

  it('should run command', async () => {
    await run([], resolve(__dirname, 'fixtures/single-cmd-cli-deprecated/package.json'))
    expect(stdoutStub.firstCall.firstArg).to.equal('hello world!\n')
  })
})
