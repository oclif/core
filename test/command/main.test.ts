import {expect, fancy} from 'fancy-test'
import path = require('path')

import {run} from '../../src/main'

const root = path.resolve(__dirname, '../../package.json')
const pjson = require(root)
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

describe('main', () => {
  fancy
  .stdout()
  .do(() => run(['plugins'], root))
  .do((output: any) => expect(output.stdout).to.equal('no plugins installed\n'))
  .it('runs plugins')

  fancy
  .stdout()
  .do(() => run(['--version'], root))
  .do((output: any) => expect(output.stdout).to.equal(version + '\n'))
  .it('runs -v')

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
  .it('runs -h')
})
