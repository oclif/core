import {expect, fancy} from 'fancy-test'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {run} from '../../src/main'

// This tests file URL / import.meta.url simulation.
const convertToFileURL = (filepath: string) => pathToFileURL(filepath).toString()

let root = resolve(__dirname, '../../package.json')
const pjson = require(root)
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

root = convertToFileURL(root)

describe('main-esm', () => {
  fancy
    .stdout()
    .do(() => run(['plugins'], root))
    .do((output: any) => expect(output.stdout).to.equal('No plugins installed.\n'))
    .it('runs plugins')

  fancy
    .stdout()
    .do(() => run(['--version'], root))
    .do((output: any) => expect(output.stdout).to.equal(version + '\n'))
    .it('runs --version')

  fancy
    .stdout()
    .do(() => run(['--help'], root))
    .do((output: any) =>
      expect(output.stdout).to.equal(`base library for oclif CLIs

VERSION
  ${version}

USAGE
  $ oclif [COMMAND]

TOPICS
  plugins  List installed plugins.

COMMANDS
  help     Display help for oclif.
  plugins  List installed plugins.

`),
    )
    .it('runs --help')

  fancy
    .stdout()
    .do(() => run(['--help', 'foo'], convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json'))))
    .do((output: any) =>
      expect(output.stdout).to.equal(`foo topic description

USAGE
  $ oclif-esm foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`),
    )
    .it('runs spaced topic help')

  fancy
    .stdout()
    .do(() => run(['foo', 'bar', '--help'], convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json'))))
    .do((output: any) =>
      expect(output.stdout).to.equal(`foo bar topic description

USAGE
  $ oclif-esm foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`),
    )
    .it('runs spaced topic help v2')

  fancy
    .stdout()
    .do(() => run(['foo', 'baz'], convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json'))))
    .do((output: any) => expect(output.stdout).to.equal('running Baz\n'))
    .it('runs foo:baz with space separator')

  fancy
    .stdout()
    .do(() => run(['foo', 'bar', 'succeed'], convertToFileURL(resolve(__dirname, 'fixtures/esm/package.json'))))
    .do((output: any) => expect(output.stdout).to.equal('it works!\n'))
    .it('runs foo:bar:succeed with space separator')
})
