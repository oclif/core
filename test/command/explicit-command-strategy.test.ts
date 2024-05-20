import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {resolve} from 'node:path'

const root = resolve(__dirname, 'fixtures/bundled-cli/package.json')

describe('explicit command discovery strategy', () => {
  it('should show help for commands', async () => {
    const {stdout} = await runCommand(['--help', 'foo'], {root})
    expect(stdout).to.include('example hook running --help')
    expect(stdout).to.include(`foo topic description

USAGE
  $ oclif foo COMMAND

COMMANDS
  foo alias  foo bar description
  foo bar    foo bar description
  foo baz    foo baz description

`)
  })

  it('should run command', async () => {
    const {stdout} = await runCommand(['foo:bar'], {root})
    expect(stdout).to.equal('example hook running foo:bar\nhello world!\n')
  })

  it('should run alias', async () => {
    const {stdout} = await runCommand(['foo:alias'], {root})
    expect(stdout).to.equal('example hook running foo:alias\nhello world!\n')
  })
})
