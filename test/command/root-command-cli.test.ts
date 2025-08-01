import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {resolve} from 'node:path'

const root = resolve(__dirname, 'fixtures/root-cmd-cli/package.json')

describe('root command cli', () => {
  it('should run root command when no args provided', async () => {
    const {stdout} = await runCommand([], {root})
    expect(stdout).to.equal('hello from root command!\n')
  })

  it('should run root command with arguments', async () => {
    const {stdout} = await runCommand(['world'], {root})
    expect(stdout).to.equal('hello from root command world!\n')
  })

  it('should show help for root command when --help flag is used', async () => {
    const {stdout} = await runCommand(['--help'], {root})
    expect(stdout).to.equal(`This is the root command of a multi-command CLI

USAGE
  $ root-cmd-cli  [NAME] [--version]

ARGUMENTS
  NAME  name to print

FLAGS
  --version  Show CLI version.

DESCRIPTION
  This is the root command of a multi-command CLI

`)
  })

  it('should prioritize subcommands over root command', async () => {
    const {stdout} = await runCommand(['hello'], {root})
    expect(stdout).to.equal('hello from subcommand!\n')
  })

  it('should run nested subcommands correctly', async () => {
    const {stdout} = await runCommand(['foo', 'bar'], {root})
    expect(stdout).to.equal('hello from foo bar!\n')
  })

  it('should show help for subcommands', async () => {
    const {stdout} = await runCommand(['hello', '--help'], {root})
    expect(stdout).to.include('Hello subcommand')
    expect(stdout).to.include('USAGE')
    expect(stdout).to.include('$ root-cmd-cli hello')
  })

  it('should pass arguments to root command when no subcommand matches', async () => {
    const {stdout} = await runCommand(['nonexistent'], {root})
    expect(stdout).to.equal('hello from root command nonexistent!\n')
  })

  it('should handle flags with root command', async () => {
    const {stdout} = await runCommand(['--version'], {root})
    expect(stdout).to.include('root-cmd-cli/0.0.0')
  })

  it('should handle root command with an argument', async () => {
    const {stdout} = await runCommand(['arg1'], {root}, {print: true})
    expect(stdout).to.equal('hello from root command arg1!\n')
  })

  it('should handle nested subcommands with strict=false arguments', async () => {
    const {stdout} = await runCommand(['foo', 'bar', 'arg1', 'arg2'], {root}, {print: true})
    expect(stdout).to.equal('hello from foo bar! arg1 arg2\n')
  })
})
