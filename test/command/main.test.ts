
import {expect} from 'chai'
import * as path from 'path'
import {createSandbox, SinonSandbox, SinonStub} from 'sinon'
import stripAnsi = require('strip-ansi')
import {requireJson} from '../../src/util'
import {run} from '../../src/main'
import {Interfaces} from '../../src/index'

const pjson = requireJson<Interfaces.PJSON>(__dirname, '..', '..', 'package.json')
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

class StdStreamsMock {
  public stdoutStub!: SinonStub
  public stderrStub!: SinonStub

  constructor(private options: {printStdout?: boolean; printStderr?: boolean} = {printStdout: false, printStderr: false}) {
    this.init()
  }

  init() {
    let sandbox: SinonSandbox

    beforeEach(() => {
      sandbox = createSandbox()
      this.stdoutStub = sandbox.stub(process.stdout, 'write').returns(true)
      this.stderrStub = sandbox.stub(process.stderr, 'write').returns(true)
    })

    afterEach(() => {
      sandbox.restore()
      if (this.options.printStdout) {
        for (const args of [...this.stdoutStub.args].slice(0, -1)) {
          process.stdout.write(args[0], args[1])
        }
      }

      if (this.options.printStderr) {
        for (const args of [...this.stderrStub.args].slice(0, -1)) {
          process.stdout.write(args[0], args[1])
        }
      }

      // The last call is mocha reporting the current test, so print that out
      process.stdout.write(this.stdoutStub.lastCall.args[0], this.stdoutStub.lastCall.args[1])
    })
  }

  get stdout(): string {
    return this.stdoutStub.args.map(a => stripAnsi(a[0])).join('')
  }

  get stderr(): string {
    return this.stderrStub.args.map(a => stripAnsi(a[0])).join('')
  }
}

describe('main', () => {
  const stdoutMock = new StdStreamsMock()

  it('should run plugins', async () => {
    await run(['plugins'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutMock.stdout).to.equal('No plugins installed.\n')
  })

  it('should run version', async () => {
    await run(['--version'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutMock.stdout).to.equal(`${version}\n`)
  })

  it('should run help', async () => {
    await run(['--help'], path.resolve(__dirname, '../../package.json'))
    expect(stdoutMock.stdout).to.equal(`base library for oclif CLIs

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
    expect(stdoutMock.stdout).to.equal(`foo topic description

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
    expect(stdoutMock.stdout).to.equal(`foo bar topic description

USAGE
  $ oclif foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`)
  })

  it('should run foo:baz with space separator', async () => {
    await run(['foo', 'baz'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutMock.stdout).to.equal('running Baz\n')
  })

  it('should run foo:bar:succeed with space separator', async () => {
    await run(['foo', 'bar', 'succeed'], path.resolve(__dirname, 'fixtures/typescript/package.json'))
    expect(stdoutMock.stdout).to.equal('it works!\n')
  })
})
