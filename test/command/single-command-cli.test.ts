import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {resolve} from 'node:path'

describe('single command cli', () => {
  it('should show help for commands', async () => {
    const {stdout} = await runCommand(['--help'], {root: resolve(__dirname, 'fixtures/single-cmd-cli/package.json')})
    expect(stdout).to.equal(`Description of single command CLI.

USAGE
  $ single-cmd-cli

DESCRIPTION
  Description of single command CLI.

`)
  })

  it('should run command', async () => {
    const {stdout} = await runCommand([], {root: resolve(__dirname, 'fixtures/single-cmd-cli/package.json')})
    expect(stdout).to.equal('hello world!\n')
  })
})
