/* eslint-disable no-import-assign */
import {expect, fancy} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as process from 'process'

import {CLIError, config, ExitError} from '../../src/errors'
import {handle} from '../../src/errors/handle'
import {exit as exitErrorThrower} from '../../src/errors'
import {EOL} from 'os'

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

  fancy
  .stdout()
  .stderr()
  .finally(() => delete process.exitCode)
  .it('hides an exit error', ctx => {
    handle(new ExitError(0))
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
    expect(process.exitCode).to.equal(0)
  })

  fancy
  .stderr()
  .do(() => {
    config.errlog = errlog
  })
  .finally(() => {
    config.errlog = undefined
  })
  .finally(() => delete process.exitCode)
  .it('logs when errlog is set', async ctx => {
    handle(new CLIError('uh oh!'))
    expect(ctx.stderr).to.equal(` ${x}   Error: uh oh!${EOL}`)
    await config.errorLogger!.flush()
    expect(fs.readFileSync(errlog, 'utf8')).to.contain('Error: uh oh!')
    expect(process.exitCode).to.equal(2)
  })

  describe('exit', () => {
    fancy
    .stderr()
    .stdout()
    .it('exits without displaying anything', ctx => {
      try {
        exitErrorThrower(9000)
      } catch (error) {
        handle(error)
      }

      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.equal('')
      expect(process.exitCode).to.be.equal(9000)
    })
  })
})
