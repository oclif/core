import {expect, fancy} from 'fancy-test'
import path = require('path')

import {Main} from '../../src/main'
import {Config} from '../../src'
import {TestHelpClassConfig} from './helpers/test-help-in-src/src/test-help-plugin'

const root = path.resolve(__dirname, '../../package.json')
const pjson = require(root)
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`

describe('main', () => {
  fancy
  .stdout()
  .do(() => Main.run(['plugins'], root))
  .do((output: any) => expect(output.stdout).to.equal('no plugins installed\n'))
  .it('runs plugins')

  fancy
  .stdout()
  .do(() => Main.run(['-v'], root))
  .catch('EEXIT: 0')
  .do((output: any) => expect(output.stdout).to.equal(version + '\n'))
  .it('runs -v')

  fancy
  .stdout()
  .do(() => Main.run(['-h'], root))
  .catch('EEXIT: 0')
  .do((output: any) => expect(output.stdout).to.equal(`base library for oclif CLIs

VERSION
  ${version}

USAGE
  $ oclif [COMMAND]

TOPICS
  plugins  list installed plugins

COMMANDS
  plugins  list installed plugins

`))
  .it('runs -h')

  describe('with an alternative help class', async () => {
    const getMainWithHelpClass = async () => {
      const config: TestHelpClassConfig = await Config.load(root)
      config.pjson.oclif.helpClass = './test/command/helpers/test-help-in-src/src/test-help-plugin'

      class MainWithHelpClass extends Main {
        config = config
      }

      return MainWithHelpClass
    }

    fancy
    .stdout()
    .do(async () => (await getMainWithHelpClass()).run(['-h']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with -h')

    fancy
    .stdout()
    .do(async () => (await getMainWithHelpClass()).run(['--help']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with --help')

    fancy
    .stdout()
    .do(async () => (await getMainWithHelpClass()).run(['help']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with help')
  })
})
