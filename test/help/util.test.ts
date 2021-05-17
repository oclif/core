/* eslint-disable max-nested-callbacks */
import {resolve} from 'path'
import {Config, Interfaces} from '../../src'
import {expect, test} from '@oclif/test'
import {getHelpClass, standardizeIDFromArgv} from '../../src/help'
import configuredHelpClass from  '../../src/help/_test-help-class'

describe('util', () => {
  let config: Interfaces.Config

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
      .it('throws an error when failing to load the help class defined in pjson.oclif.helpClass', () => {
        config.pjson.oclif.helpClass = './lib/does-not-exist-help-class'
        expect(() => getHelpClass(config)).to.throw('Unable to load configured help class "./lib/does-not-exist-help-class", failed with message:')
      })
    })
  })

  describe('#standardizeIDFromArgv', () => {
    test
    .it('should return standardized id when topic separator is a colon', () => {
      config.pjson.oclif.topicSeparator = ':'
      const actual = standardizeIDFromArgv(['foo:bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    test
    .stub(Config.prototype, 'commandIDs', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space', () => {
      config.topicSeparator = ' '
      const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    test
    .stub(Config.prototype, 'commandIDs', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and command is misspelled', () => {
      config.topicSeparator = ' '
      const actual = standardizeIDFromArgv(['foo', 'ba', '--baz'], config)
      expect(actual).to.deep.equal(['foo:ba', '--baz'])
    })
  })
})
