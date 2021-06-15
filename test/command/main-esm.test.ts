import {expect, fancy} from 'fancy-test'
import {EOL} from 'os'
import * as path from 'path'
import * as url from 'url'

import {run} from '../../src/main'

// This tests file URL / import.meta.url simulation.
const convertToFileURL = (filepath: string) => url.pathToFileURL(filepath).toString()

let root = path.resolve(__dirname, '../../package.json')
const pjson = require(root)
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

root = convertToFileURL(root)

describe('main-esm', () => {
  fancy
  .stdout()
  .do(() => run(['plugins'], root))
  .do((output: any) => expect(output.stdout).to.equal('no plugins installed' + EOL))
  .it('runs plugins')

  fancy
  .stdout()
  .do(() => run(['--version'], root))
  .do((output: any) => expect(output.stdout).to.equal(version + EOL))
  .it('runs --version')

  fancy
  .stdout()
  .do(() => run(['--help'], root))
  .do((output: any) => expect(output.stdout).to.equal(`base library for oclif CLIs

VERSION
  ${version}

USAGE
  $ oclif [COMMAND]

TOPICS
  plugins  list installed plugins

COMMANDS
  help     display help for oclif
  plugins  list installed plugins

`))
  .it('runs --help')

  fancy
  .stdout()
  .do(() => run(['--help', 'foo'], convertToFileURL(path.resolve(__dirname, 'fixtures/esm/package.json'))))
  .do((output: any) => expect(output.stdout).to.equal(`foo topic description

USAGE
  $ oclif-esm foo COMMAND

TOPICS
  foo bar  foo bar topic description

COMMANDS
  foo baz  foo baz description

`))
  .it('runs spaced topic help')

  fancy
  .stdout()
  .do(() => run(['foo', 'bar', '--help'], convertToFileURL(path.resolve(__dirname, 'fixtures/esm/package.json'))))
  .do((output: any) => expect(output.stdout).to.equal(`foo bar topic description

USAGE
  $ oclif-esm foo bar COMMAND

COMMANDS
  foo bar fail     fail description
  foo bar succeed  succeed description

`))
  .it('runs spaced topic help v2')

  fancy
  .stdout()
  .do(() => run(['foo', 'baz'], convertToFileURL(path.resolve(__dirname, 'fixtures/esm/package.json'))))
  .do((output: any) => expect(output.stdout).to.equal('running Baz' + EOL))
  .it('runs foo:baz with space separator')

  fancy
  .stdout()
  .do(() => run(['foo', 'bar', 'succeed'], convertToFileURL(path.resolve(__dirname, 'fixtures/esm/package.json'))))
  .do((output: any) => expect(output.stdout).to.equal('it works!' + EOL))
  .it('runs foo:bar:succeed with space separator')
})
