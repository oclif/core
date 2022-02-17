import {resolve} from 'path'
import {Config, Interfaces} from '../../src'
import {expect, test} from '@oclif/test'
import {loadHelpClass, standardizeIDFromArgv} from '../../src/help'
import configuredHelpClass from  '../../src/help/_test-help-class'

describe('util', () => {
  let config: Interfaces.Config

  beforeEach(async () => {
    config = await Config.load()
  })

  describe('#loadHelpClass', () => {
    test
    .it('defaults to the class exported', async () => {
      delete config.pjson.oclif.helpClass

      const helpClass = await loadHelpClass(config)
      expect(helpClass).not.be.undefined
      expect(helpClass.prototype.showHelp)
      expect(helpClass.prototype.showCommandHelp)
      expect(helpClass.prototype.formatRoot)
    })

    test
    .it('loads help class defined in pjson.oclif.helpClass', async () => {
      config.pjson.oclif.helpClass = '../src/help/_test-help-class'
      config.root = resolve(__dirname, '..')

      expect(configuredHelpClass).to.not.be.undefined
      expect(await loadHelpClass(config)).to.deep.equal(configuredHelpClass)
    })

    describe('error cases', () => {
      test
      .it('throws an error when failing to load the help class defined in pjson.oclif.helpClass', async () => {
        config.pjson.oclif.helpClass = './lib/does-not-exist-help-class'
        await expect(loadHelpClass(config)).to.be.rejectedWith('Unable to load configured help class "./lib/does-not-exist-help-class", failed with message:')
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
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space', () => {
      config.topicSeparator = ' '
      const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and command is misspelled', () => {
      config.topicSeparator = ' '
      const actual = standardizeIDFromArgv(['foo', 'ba', '--baz'], config)
      expect(actual).to.deep.equal(['foo:ba', '--baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has args', () => {
      config.topicSeparator = ' '
      config.commands.push({
        id: 'foo:bar',
        args: [{name: 'first'}],
      } as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has variable arguments', () => {
      config.topicSeparator = ' '
      config.commands.push({
        id: 'foo:bar',
        strict: false,
      } as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has variable arguments and flags', () => {
      config.topicSeparator = ' '
      config.commands.push({
        id: 'foo:bar',
        strict: false,
      } as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz', '--hello'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz', '--hello'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return full id when topic separator is a space and does not have arguments', () => {
      config.topicSeparator = ' '
      config.commands.push({
        id: 'foo:bar',
        args: [],
        strict: true,
      } as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar:baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has arg with value', () => {
      config.topicSeparator = ' '
      config.commands.push({id: 'foo:bar'} as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world'], config)
      expect(actual).to.deep.equal(['foo:bar', 'hello=world'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has variable args with value', () => {
      config.topicSeparator = ' '
      config.commands.push({id: 'foo:bar', strict: false} as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world', 'my-arg=value'], config)
      expect(actual).to.deep.equal(['foo:bar', 'hello=world', 'my-arg=value'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has flags', () => {
      config.topicSeparator = ' '
      config.commands.push({id: 'foo:bar'} as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    test
    .stub(Config.prototype, 'collectUsableIds', () => ['foo', 'foo:bar'])
    .it('should return standardized id when topic separator is a space and has flags, arg, and arg with value', () => {
      config.topicSeparator = ' '
      config.commands.push({
        id: 'foo:bar',
        args: [{name: 'my-arg'}],
        strict: true,
      } as any)
      const actual = standardizeIDFromArgv(['foo', 'bar', 'my-arg', 'hello=world', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'my-arg', 'hello=world', '--baz'])
    })
  })
})
