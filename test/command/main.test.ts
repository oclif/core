import {expect, fancy} from 'fancy-test'

import {Main} from '../../src/command/main'
import * as PluginHelp from '../../src/help'
import * as Config from '../../src/config'
import {TestHelpClassConfig} from './helpers/test-help-in-src/src/test-help-plugin'
import path = require('path')

const pjson = require(path.resolve(__dirname, '../../package.json'))
const version = `@oclif/core/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`
const originalgetHelpClass = PluginHelp.getHelpClass

describe('main', () => {
  fancy
  .stdout()
  .do(() => Main.run(['plugins']))
  .do((output: any) => expect(output.stdout).to.equal('no plugins installed\n'))
  .it('runs plugins')

  fancy
  .stdout()
  .do(() => Main.run(['-v']))
  .catch('EEXIT: 0')
  .do((output: any) => expect(output.stdout).to.equal(version + '\n'))
  .it('runs -v')

  fancy
  .stdout()
  .do(() => Main.run(['-h']))
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
      const config: TestHelpClassConfig = await Config.load()
      config.pjson.oclif.helpClass = './src/test-help-plugin'

      class MainWithHelpClass extends Main {
        config = config
      }

      return MainWithHelpClass
    }

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', ((config: Config.IConfig) => {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    }) as unknown as () => void)
    .do(async () => (await getMainWithHelpClass()).run(['-h']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with -h')

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', ((config: Config.IConfig) =>  {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    }) as unknown as () => void)
    .do(async () => (await getMainWithHelpClass()).run(['--help']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with --help')

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', ((config: Config.IConfig) => {
      const patchedConfig = {
        ...config,
        root: `${__dirname}/helpers/test-help-in-src/`,
      }

      return originalgetHelpClass(patchedConfig)
    }) as unknown as () => void)
    .do(async () => (await getMainWithHelpClass()).run(['help']))
    .catch('EEXIT: 0')
    .do((output: any) => expect(output.stdout).to.equal('hello showHelp\n'))
    .it('works with help')
  })
})
