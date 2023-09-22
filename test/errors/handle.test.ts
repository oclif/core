import {expect, fancy} from 'fancy-test'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import * as process from 'node:process'

import {CLIError, ExitError, config, exit as exitErrorThrower} from '../../src/errors'
import {Exit, handle} from '../../src/errors/handle'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'

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

  fancy
  .stdout()
  .stderr()
  .it('hides an exit error', async ctx => {
    await handle(new ExitError(0))
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  fancy
  .stdout()
  .stderr()
  .it('prints error', async ctx => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = false
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
  })

  fancy
  .stdout()
  .stderr()
  .it('should not print error when skipOclifErrorHandling is true', async ctx => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = true
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
  })

  fancy
  .stderr()
  .do(() => {
    config.errlog = errlog
  })
  .finally(() => {
    config.errlog = undefined
  })
  .it('logs when errlog is set', async ctx => {
    await handle(new CLIError('uh oh!'))
    expect(ctx.stderr).to.equal(` ${x}   Error: uh oh!\n`)
    await config.errorLogger!.flush()
    expect(readFileSync(errlog, 'utf8')).to.contain('Error: uh oh!')
    expect(exitStub.firstCall.firstArg).to.equal(2)
  })

  fancy
  .stdout()
  .stderr()
  .it('should use default exit code for Error (1)', async ctx => {
    const error = new Error('foo bar baz')
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(1)
  })

  fancy
  .stdout()
  .stderr()
  .it('should use default exit code for CLIError (2)', async ctx => {
    const error = new CLIError('foo bar baz')
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(2)
  })

  fancy
  .stdout()
  .stderr()
  .it('should use exit code provided by CLIError (0)', async ctx => {
    const error = new CLIError('foo bar baz', {exit: 0})
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  fancy
  .stdout()
  .stderr()
  .it('should use exit code provided by CLIError (9999)', async ctx => {
    const error = new CLIError('foo bar baz', {exit: 9999})
    await handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(9999)
  })

  describe('exit', () => {
    fancy
    .stderr()
    .stdout()
    .it('exits without displaying anything', async ctx => {
      try {
        exitErrorThrower(9000)
      } catch (error: any) {
        await handle(error)
      }

      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.equal('')
      expect(exitStub.firstCall.firstArg).to.equal(9000)
    })
  })
})
