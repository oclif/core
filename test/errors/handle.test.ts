import {expect, fancy} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as process from 'process'

import {CLIError, config, ExitError} from '../../src/errors'
import {handle} from '../../src/errors/handle'
import {exit as exitErrorThrower} from '../../src/errors'

const errlog = path.join(__dirname, '../tmp/mytest/error.log')
const x = process.platform === 'win32' ? '»' : '›'

const originalExit = process.exit
const originalExitCode = process.exitCode

describe('handle', () => {
  beforeEach(() => {
    (process as any).exitCode = undefined;
    (process as any).exit = (code: any) => {
      (process as any).exitCode = code
    }
  })
  afterEach(() => {
    (process as any).exit = originalExit;
    (process as any).exitCode = originalExitCode
  })

  // fancy
  // .stderr()
  // .finally(() => delete process.exitCode)
  // .it('displays an error from root handle module', ctx => {
  //   handle(new Error('x'))
  //   expect(ctx.stderr).to.contain('Error: x')
  //   expect(process.exitCode).to.equal(1)
  // })

  // fancy
  // .stderr()
  // .finally(() => delete process.exitCode)
  // .it('shows an unhandled error', ctx => {
  //   handle(new Error('x'))
  //   expect(ctx.stderr).to.contain('Error: x')
  //   expect(process.exitCode).to.equal(1)
  // })

  // fancy
  // .stderr()
  // .finally(() => delete process.exitCode)
  // .it('handles a badly formed error object', () => {
  //   handle({status: 400} as any)
  //   expect(process.exitCode).to.equal(1)
  // })

  // fancy
  // .stderr()
  // .finally(() => delete process.exitCode)
  // .it('shows a cli error', ctx => {
  //   handle(new CLIError('x'))
  //   expect(ctx.stderr).to.equal(` ${x}   Error: x\n`)
  //   expect(process.exitCode).to.equal(2)
  // })

  fancy
  .stdout()
  .stderr()
  .it('hides an exit error', ctx => {
    handle(new ExitError(0))
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
    expect(process.exitCode).to.equal(0)
  })

  fancy
  .stdout()
  .stderr()
  .it('prints error', ctx => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = false
    handle(error)
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.include('foo bar baz')
  })

  fancy
  .stdout()
  .stderr()
  .it('should not print error when skipOclifErrorHandling is true', ctx => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = true
    handle(error)
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
    handle(new CLIError('uh oh!'))
    expect(ctx.stderr).to.equal(` ${x}   Error: uh oh!\n`)
    await config.errorLogger!.flush()
    expect(fs.readFileSync(errlog, 'utf8')).to.contain('Error: uh oh!')
    expect(process.exitCode).to.equal(2)
  })

  describe.skip('exit', () => {
    fancy
    .stderr()
    .stdout()
    .it('exits without displaying anything', ctx => {
      try {
        exitErrorThrower(9000)
      } catch (error: any) {
        handle(error)
      }

      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.equal('')
      expect(process.exitCode).to.be.equal(9000)
    })
  })
})
