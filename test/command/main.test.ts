import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import type CacheType from '../../src/cache'
import type {execute as executeType} from '../../src/execute'
import type {LoadOptions} from '../../src/interfaces'

import {getPlatform} from '../../src/util/os'

const Cache = require('../../src/cache') as {default: typeof CacheType} // eslint-disable-line n/no-missing-require
const {execute} = require('../../src/execute') as {execute: typeof executeType} // eslint-disable-line n/no-missing-require

const loadOptions: LoadOptions = undefined

const pjson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'))

describe('main', () => {
  let version: string

  before(async () => {
    version = `@oclif/core/${pjson.version} ${await getPlatform()}-${process.arch} node-${process.version}`
  })

  it('should run plugins', async () => {
    const {result} = await runCommand<
      Array<{
        name: string
        type: string
      }>
    >(['plugins'])
    expect(result?.length).to.equal(3)
    const rootPlugin = result?.find((r) => r.name === '@oclif/core')
    const pluginHelp = result?.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result?.find((r) => r.name === '@oclif/plugin-plugins')

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

  it('merges load options with the directory', async () => {
    const root = resolve(__dirname, 'fixtures/typescript/package.json')

    await execute({args: ['foo', 'baz'], dir: root, loadOptions: {ignoreManifest: true}})

    expect(Cache.default.getInstance().get('config')?.options).to.include({ignoreManifest: true, root})
  })

  it('ignores a stale manifest when loading commands through execute', async () => {
    const root = mkdtempSync(join(__dirname, 'tmp-'))
    const fixture = resolve(__dirname, 'fixtures/typescript')
    mkdirSync(join(root, 'src/commands/foo'), {recursive: true})
    writeFileSync(join(root, 'package.json'), readFileSync(join(fixture, 'package.json')))
    writeFileSync(join(root, 'tsconfig.json'), readFileSync(join(fixture, 'tsconfig.json')))
    writeFileSync(join(root, 'src/commands/foo/baz.ts'), readFileSync(join(fixture, 'src/commands/foo/baz.ts')))
    writeFileSync(
      join(root, 'oclif.manifest.json'),
      JSON.stringify({
        commands: {
          'foo:baz': {
            aliases: [],
            args: {},
            description: 'stale manifest description',
            flags: {},
            hidden: false,
            hiddenAliases: [],
            id: 'foo:baz',
          },
        },
        version: '0.0.0',
      }),
    )

    try {
      await execute({args: ['foo', 'baz'], dir: join(root, 'package.json'), loadOptions: {ignoreManifest: true}})

      expect(Cache.default.getInstance().get('config')?.findCommand('foo:baz')?.description).to.equal(
        'foo baz description',
      )
    } finally {
      rmSync(root, {force: true, recursive: true})
    }
  })

  it('accepts undefined load options', async () => {
    const root = resolve(__dirname, 'fixtures/typescript/package.json')

    await execute({args: ['foo', 'baz'], dir: root, loadOptions})

    expect(Cache.default.getInstance().get('config')?.options).to.include({root})
  })

  it('prefers an explicit load options root over the directory', async () => {
    const root = resolve(__dirname, 'fixtures/typescript/package.json')

    await execute({args: ['foo', 'baz'], dir: __dirname, loadOptions: {ignoreManifest: true, root}})

    expect(Cache.default.getInstance().get('config')?.options).to.include({ignoreManifest: true, root})
  })

  it('uses a file URL directory as the load options root', async () => {
    const root = resolve(__dirname, 'fixtures/typescript/package.json')

    await execute({args: ['foo', 'baz'], dir: pathToFileURL(root).href, loadOptions: {ignoreManifest: true}})

    expect(Cache.default.getInstance().get('config')?.options).to.include({ignoreManifest: true, root})
  })

  it('should catch errors from commands', async () => {
    const {stdout, error} = await runCommand(['foo', 'bar', 'fail'], {
      root: resolve(__dirname, 'fixtures/typescript/package.json'),
    })
    expect(error, 'Error to be thrown').to.exist
    expect(error?.message).to.include('random error')
    expect(stdout).to.equal('it fails!\n')
  })
})
