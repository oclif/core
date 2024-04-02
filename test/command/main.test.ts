import {expect} from 'chai'
import {readFileSync} from 'node:fs'
import {join, resolve} from 'node:path'

import {runCommand} from '../test'

const pjson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'))
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

describe('main', () => {
  it('should run plugins', async () => {
    const {result} = await runCommand<
      Array<{
        name: string
        type: string
      }>
    >(['plugins'])
    expect(result.length).to.equal(3)
    const rootPlugin = result.find((r) => r.name === '@oclif/core')
    const pluginHelp = result.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result.find((r) => r.name === '@oclif/plugin-plugins')

    expect(rootPlugin).to.exist
    expect(pluginHelp).to.exist
    expect(pluginPlugins).to.exist
  })

  it('should run version', async () => {
    const {stdout} = await runCommand(['--version'])
    expect(stdout).to.equal(`${version}\n`)
  })

  it('should run help', async () => {
    const {stdout} = await runCommand(['--help'])
    expect(stdout).to.equal(`base library for oclif CLIs

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
    const {stdout} = await runCommand(['--help', 'foo'], {root: resolve(__dirname, 'fixtures/typescript/package.json')})
    expect(stdout).to.equal(`foo topic description

USAGE
  $ oclif foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`)
  })

  it('should run spaced topic help v2', async () => {
    const {stdout} = await runCommand(['foo', 'bar', '--help'], {
      root: resolve(__dirname, 'fixtures/typescript/package.json'),
    })
    expect(stdout).to.equal(`foo bar topic description

USAGE
  $ oclif foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`)
  })

  it('should run foo:baz with space separator', async () => {
    const {stdout} = await runCommand(['foo', 'baz'], {root: resolve(__dirname, 'fixtures/typescript/package.json')})
    expect(stdout).to.equal('running Baz\n')
  })

  it('should run foo:bar:succeed with space separator', async () => {
    const {stdout} = await runCommand(['foo', 'bar', 'succeed'], {
      root: resolve(__dirname, 'fixtures/typescript/package.json'),
    })
    expect(stdout).to.equal('it works!\n')
  })
})
