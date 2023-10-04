import {expect} from 'chai'
import {resolve} from 'node:path'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'

import {Interfaces, stdout} from '../../src/index'
import {run} from '../../src/main'
import {requireJson} from '../../src/util/fs'

import stripAnsi = require('strip-ansi')

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

  it('should run plugins', async () => {
    const result = await run(['plugins'], resolve(__dirname, '../../package.json'))
    expect(result).to.deep.equal([])
  })

  it('should run version', async () => {
    await run(['--version'], resolve(__dirname, '../../package.json'))
    expect(stdoutStub.firstCall.firstArg).to.equal(`${version}\n`)
  })

  it('should run help', async () => {
    await run(['--help'], resolve(__dirname, '../../package.json'))
    expect(stdoutStub.args.map((a) => stripAnsi(a[0])).join('')).to.equal(`base library for oclif CLIs

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
    await run(['--help', 'foo'], resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutStub.args.map((a) => stripAnsi(a[0])).join('')).to.equal(`foo topic description

USAGE
  $ oclif foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`)
  })

  it('should run spaced topic help v2', async () => {
    await run(['foo', 'bar', '--help'], resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutStub.args.map((a) => stripAnsi(a[0])).join('')).to.equal(`foo bar topic description

USAGE
  $ oclif foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`)
  })

  it('should run foo:baz with space separator', async () => {
    const consoleLogStub = sandbox.stub(console, 'log').returns()
    await run(['foo', 'baz'], resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(consoleLogStub.firstCall.firstArg).to.equal('running Baz')
  })

  it('should run foo:bar:succeed with space separator', async () => {
    const consoleLogStub = sandbox.stub(console, 'log').returns()
    await run(['foo', 'bar', 'succeed'], resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(consoleLogStub.firstCall.firstArg).to.equal('it works!')
  })
})
