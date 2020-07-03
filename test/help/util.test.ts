/* eslint-disable max-nested-callbacks */
import {resolve} from 'path'
import * as Config from '@oclif/config'
import {expect, test} from '@oclif/test'
import {getHelpClass} from '../src/util'
import configuredHelpClass from  '../src/_test-help-class'

describe('util', () => {
  let config: Config.IConfig

  beforeEach(async () => {
    config = await Config.load()
  })

  describe('#getHelpClass', () => {
    test
    .it('defaults to the class exported', () => {
      // eslint-disable-next-line node/no-extraneous-require
      const defaultHelpClass = require('@oclif/plugin-help').default
      delete config.pjson.oclif.helpClass

      expect(defaultHelpClass).not.be.undefined
      expect(getHelpClass(config)).to.deep.equal(defaultHelpClass)
    })

    test
    .it('loads help class defined in pjson.oclif.helpClass', () => {
      config.pjson.oclif.helpClass = './lib/_test-help-class'
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
