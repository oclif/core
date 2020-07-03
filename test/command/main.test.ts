import {expect, fancy} from 'fancy-test'

import {Main} from '../src/main'
import * as PluginHelp from '@oclif/plugin-help'
import * as Config from '@oclif/config'
import {TestHelpClassConfig} from './helpers/test-help-in-src/src/test-help-plugin'

const pjson = require('../package.json')
const version = `@oclif/command/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`
const originalgetHelpClass = PluginHelp.getHelpClass

describe('main', () => {
  fancy
  .stdout()
  .do(() => Main.run(['plugins']))
  .do(output => expect(output.stdout).to.equal('no plugins installed\n'))
  .it('runs plugins')

  fancy
  .stdout()
  .do(() => Main.run(['-v']))
  .catch('EEXIT: 0')
  .do(output => expect(output.stdout).to.equal(version + '\n'))
  .it('runs -v')

  fancy
  .stdout()
  .do(() => Main.run(['-h']))
  .catch('EEXIT: 0')
  .do(output => expect(output.stdout).to.equal(`oclif base command

VERSION
  ${version}

USAGE
  $ @oclif/command [COMMAND]

TOPICS
  plugins  list installed plugins

COMMANDS
  help     display help for @oclif/command
  plugins  list installed plugins

`))
  .it('runs -h')

  describe('with an alternative help class', async () => {
    const getMainWithHelpClass = async () => {
      const config: TestHelpClassConfig = await Config.load()
      config.pjson.oclif.helpClass = './lib/test-help-plugin'

      class MainWithHelpClass extends Main {
        config = config
      }

      return MainWithHelpClass
    }

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    })
    .do(async () => (await getMainWithHelpClass()).run(['-h']))
    .catch('EEXIT: 0')
    .do(output => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with -h')

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    })
    .do(async () => (await getMainWithHelpClass()).run(['--help']))
    .catch('EEXIT: 0')
    .do(output => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with --help')

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    })
    .do(async () => (await getMainWithHelpClass()).run(['help']))
    .catch('EEXIT: 0')
    .do(output => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with help')
  })
})
