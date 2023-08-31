
import {expect} from 'chai'
import * as path from 'path'
import {createSandbox, SinonSandbox, SinonStub} from 'sinon'
import stripAnsi = require('strip-ansi')
import {requireJson} from '../../src/util'
import run from '../../src/main'
import {Interfaces, stdout} from '../../src/index'

const pjson = requireJson<Interfaces.PJSON>(__dirname, '..', '..', 'package.json')
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

describe('main', () => {
  let sandbox: SinonSandbox
  let stdoutStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    stdoutStub = sandbox.stub(stdout, 'write').callsFake(() => true)
  })

  afterEach(() => {
    sandbox.restore()
  })

  // need to skip until the stdout change is merged and used in plugin-plugins
  it.skip('should run plugins', async () => {
    await run(['plugins'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutStub.firstCall.firstArg).to.equal('No plugins installed.\n')
  })

  it('should run version', async () => {
    await run(['--version'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutStub.firstCall.firstArg).to.equal(`${version}\n`)
  })

  it('should run help', async () => {
    await run(['--help'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutStub.args.map(a => stripAnsi(a[0])).join('')).to.equal(`base library for oclif CLIs

VERSION
  ${version}

USAGE
  $ oclif [COMMAND]

TOPICS
  plugins  List installed plugins.

COMMANDS
  help     Display help for oclif.
  plugins  List installed plugins.

`)
  })

  it('should show help for topics with spaces', async () => {
    await run(['--help', 'foo'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutStub.args.map(a => stripAnsi(a[0])).join('')).to.equal(`foo topic description

USAGE
  $ oclif foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`)
  })

  it('should run spaced topic help v2', async () => {
    await run(['foo', 'bar', '--help'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutStub.args.map(a => stripAnsi(a[0])).join('')).to.equal(`foo bar topic description

USAGE
  $ oclif foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`)
  })

  it('should run foo:baz with space separator', async () => {
    const consoleLogStub = sandbox.stub(console, 'log').returns()
    await run(['foo', 'baz'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(consoleLogStub.firstCall.firstArg).to.equal('running Baz')
  })

  it('should run foo:bar:succeed with space separator', async () => {
    const consoleLogStub = sandbox.stub(console, 'log').returns()
    await run(['foo', 'bar', 'succeed'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(consoleLogStub.firstCall.firstArg).to.equal('it works!')
  })
})
