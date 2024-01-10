import {expect} from 'chai'
import {join, resolve} from 'node:path'
import {SinonSandbox, createSandbox} from 'sinon'

import {Config} from '../../src'
import Cache from '../../src/cache'
import {CLIError} from '../../src/errors'

function hasExitCode(error: unknown, expectedCode: number): void {
  if (error instanceof Error && error.message === 'Expected command to fail but it passed') {
    throw error
  }

  if (error instanceof CLIError) {
    expect(error.oclif.exit).to.equal(expectedCode)
  } else {
    expect.fail('Expected CLIError')
  }
}

type AsyncFunction = (...args: unknown[]) => Promise<unknown>

async function runCommand(fn: AsyncFunction, expectedCode: number): Promise<void> {
  try {
    await fn()
    expect.fail('Expected command to fail but it passed')
  } catch (error) {
    hasExitCode(error, expectedCode)
  }
}

describe('configurable error codes', () => {
  let sandbox: SinonSandbox
  let config: Config

  const defaultExitCode = 2
  const exitCodes = {
    failedFlagParsing: 101,
    failedFlagValidation: 102,
    invalidArgsSpec: 103,
    nonExistentFlag: 104,
    requiredArgs: 105,
    unexpectedArgs: 106,
  }

  beforeEach(async () => {
    sandbox = createSandbox()
    config = await Config.load(resolve(__dirname, join('fixtures', 'test-plugin')))
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('failedFlagParsing', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('test', ['--flag1', '100', '--flag2', 'arg1']), defaultExitCode)
    })

    it('should use configured exit code for failed flag parsing', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(
        () => config.runCommand('test', ['--flag1', '100', '--flag2', 'arg1']),
        exitCodes.failedFlagParsing,
      )
    })
  })

  describe('failedFlagValidation', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('test', ['--flag2', 'arg1']), defaultExitCode)
    })

    it('should use configured exit code for failed flag validation', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(() => config.runCommand('test', ['--flag2', 'arg1']), exitCodes.failedFlagValidation)
    })
  })

  describe('invalidArgsSpec', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('invalid', ['arg1', 'arg2']), defaultExitCode)
    })

    it('should use configured exit code for invalid args spec', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(() => config.runCommand('invalid', ['arg1', 'arg2']), exitCodes.invalidArgsSpec)
    })
  })

  describe('nonExistentFlag', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('test', ['--DOES_NOT_EXIST', 'arg1']), defaultExitCode)
    })

    it('should use configured exit code for failed flag validation', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(() => config.runCommand('test', ['--DOES_NOT_EXIST', 'arg1']), exitCodes.nonExistentFlag)
    })
  })

  describe('requiredArgs', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('test', ['--flag1', '1']), defaultExitCode)
    })

    it('should use configured exit code for failed flag validation', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(() => config.runCommand('test', ['--flag1', '1']), exitCodes.requiredArgs)
    })
  })

  describe('unexpectedArgs', () => {
    it('should use default exit code for failed flag parsing', async () => {
      await runCommand(() => config.runCommand('test', ['arg1', 'arg2', 'arg3']), defaultExitCode)
    })

    it('should use configured exit code for failed flag validation', async () => {
      sandbox.stub(Cache.prototype, 'get').withArgs('exitCodes').returns(exitCodes)
      await runCommand(() => config.runCommand('test', ['arg1', 'arg2', 'arg3']), exitCodes.unexpectedArgs)
    })
  })
})
