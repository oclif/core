import {expect} from 'chai'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {runCommand} from '../test'

// This tests file URL / import.meta.url simulation.
const convertToFileURL = (filepath: string) => pathToFileURL(filepath).toString()

let root = resolve(__dirname, '../../package.json')
const pjson = require(root)
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

root = convertToFileURL(root)

describe('main-esm', () => {
  it('runs plugins', async () => {
    const {stdout} = await runCommand(['plugins'], {root})
    expect(stdout).to.equal('No plugins installed.\n')
  })

  it('runs --version', async () => {
    const {stdout} = await runCommand(['--version'], {root})
    expect(stdout).to.equal(version + '\n')
  })

  it('runs --help', async () => {
    const {stdout} = await runCommand(['--help'], {root})
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

  it('runs spaced topic help', async () => {
    const {stdout} = await runCommand(
      ['--help', 'foo'],
      convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json')),
    )
    expect(stdout).to.equal(`foo topic description

USAGE
  $ oclif-esm foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`)
  })

  it('runs spaced topic help v2', async () => {
    const {stdout} = await runCommand(
      ['foo', 'bar', '--help'],
      convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json')),
    )
    expect(stdout).to.equal(`foo bar topic description

USAGE
  $ oclif-esm foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`)
  })

  it('runs foo:baz with space separator', async () => {
    const {stdout} = await runCommand(['foo', 'baz'], convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json')))
    expect(stdout).to.equal('running Baz\n')
  })

  it('runs foo:bar:succeed with space separator', async () => {
    const {stdout} = await runCommand(
      ['foo', 'bar', 'succeed'],
      convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json')),
    )
    expect(stdout).to.equal('it works!\n')
  })
})
