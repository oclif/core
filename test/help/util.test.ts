/* eslint-disable max-nested-callbacks */
import {resolve} from 'path'
import * as Config from '../../src/config'
import {expect, test} from '@oclif/test'
import {getHelpClass} from '../../src/help/util'
import configuredHelpClass from  '../../src/help/_test-help-class'

describe('util', () => {
  let config: Config.IConfig

  beforeEach(async () => {
    config = await Config.load()
  })

  describe('#getHelpClass', () => {
    test
    .it('defaults to the class exported', () => {
      delete config.pjson.oclif.helpClass

      const helpClass = getHelpClass(config)
      expect(helpClass).not.be.undefined
      expect(helpClass.prototype.showHelp)
      expect(helpClass.prototype.showCommandHelp)
      expect(helpClass.prototype.formatRoot)
    })

    test
    .it('loads help class defined in pjson.oclif.helpClass', () => {
      config.pjson.oclif.helpClass = '../src/help/_test-help-class'
      config.root = resolve(__dirname, '..')

      expect(configuredHelpClass).to.not.be.undefined
      expect(getHelpClass(config)).to.deep.equal(configuredHelpClass)
    })

    describe('error cases', () => {
      test
      .it('throws an error when failing to load the default help class', () => {
        delete config.pjson.oclif.helpClass
        expect(() => getHelpClass(config, 'does-not-exist-default-plugin')).to.throw('Could not load a help class, consider installing the @oclif/plugin-help package, failed with message:')
      })

      test
      .it('throws an error when failing to load the help class defined in pjson.oclif.helpClass', () => {
        config.pjson.oclif.helpClass = './lib/does-not-exist-help-class'
        expect(() => getHelpClass(config)).to.throw('Unable to load configured help class "./lib/does-not-exist-help-class", failed with message:')
      })
    })
  })
})
