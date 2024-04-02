import {expect} from 'chai'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import * as process from 'node:process'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'

import {CLIError, ExitError, config, exit as exitErrorThrower} from '../../src/errors'
import {Exit, handle} from '../../src/errors/handle'
import {captureOutput} from '../test'

const errlog = join(__dirname, '../tmp/mytest/error.log')
const x = process.platform === 'win32' ? '»' : '›'

describe('handle', () => {
  let sandbox: SinonSandbox
  let exitStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    exitStub = sandbox.stub(Exit, 'exit')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('hides an exit error', async () => {
    const {stdout, stderr} = await captureOutput(() => handle(new ExitError(0)))
    expect(stdout).to.be.empty
    expect(stderr).to.be.empty
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  it('prints error', async () => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = false

    const {stdout, stderr} = await captureOutput(() => handle(error))

    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
  })

  it('should not print error when skipOclifErrorHandling is true', async () => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = true
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.be.empty
  })

  describe('errlog', () => {
    beforeEach(() => {
      config.errlog = errlog
    })

    afterEach(() => {
      config.errlog = undefined
    })

    it('logs when errlog is set', async () => {
      const {stderr} = await captureOutput(() => handle(new CLIError('uh oh!')))
      expect(stderr).to.equal(` ${x}   Error: uh oh!\n`)
      await config.errorLogger!.flush()
      expect(readFileSync(errlog, 'utf8')).to.contain('Error: uh oh!')
      expect(exitStub.firstCall.firstArg).to.equal(2)
    })
  })

  it('should use default exit code for Error (1)', async () => {
    const error = new Error('foo bar baz')
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(1)
  })

  it('should use default exit code for CLIError (2)', async () => {
    const error = new CLIError('foo bar baz')
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(2)
  })

  it('should use exit code provided by CLIError (0)', async () => {
    const error = new CLIError('foo bar baz', {exit: 0})
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  it('should use exit code provided by CLIError (9999)', async () => {
    const error = new CLIError('foo bar baz', {exit: 9999})
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(9999)
  })

  describe('exit', () => {
    it('exits without displaying anything', async () => {
      const {stdout, stderr} = await captureOutput(async () => {
        try {
          exitErrorThrower(9000)
        } catch (error: any) {
          await handle(error)
        }
      })

      expect(stdout).to.be.empty
      expect(stderr).to.be.empty
      expect(exitStub.firstCall.firstArg).to.equal(9000)
    })
  })
})
