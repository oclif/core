import {expect} from 'chai'
import {resolve} from 'node:path'
import sinon from 'sinon'

import {Args, Command, Config} from '../../src'
import * as util from '../../src/config/util'
import {loadHelpClass, standardizeIDFromArgv} from '../../src/help'
import configuredHelpClass from './_test-help-class'
import {MyHelp} from './_test-help-class-identifier'

describe('util', () => {
  let config: Config
  let sandbox: sinon.SinonSandbox

  beforeEach(async () => {
    config = await Config.load()
    config.topicSeparator = ' '
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  function stubCommands(...commands: Array<Partial<Command.Cached>>) {
    // @ts-expect-error private member
    sandbox.stub(config, '_commands').value(new Map(commands.map((cmd) => [cmd.id, cmd])))
  }

  describe('#loadHelpClass', () => {
    it('defaults to the native help class', async () => {
      delete config.pjson.oclif.helpClass

      const helpClass = await loadHelpClass(config)
      expect(helpClass).not.be.undefined
      expect(helpClass.prototype.showHelp)
      expect(helpClass.prototype.showCommandHelp)
      expect(helpClass.prototype.formatRoot)
    })

    it('loads help class defined in pjson.oclif.helpClass', async () => {
      config.pjson.oclif.helpClass = '../test/help/_test-help-class'
      config.root = resolve(__dirname, '..')

      expect(configuredHelpClass).to.not.be.undefined
      expect(await loadHelpClass(config)).to.deep.equal(configuredHelpClass)
    })

    it('loads help class defined using target but no identifier', async () => {
      config.pjson.oclif.helpClass = {
        target: '../test/help/_test-help-class',
        // @ts-expect-error for testing purposes
        identifier: undefined,
      }
      config.root = resolve(__dirname, '..')

      expect(configuredHelpClass).to.not.be.undefined
      expect(await loadHelpClass(config)).to.deep.equal(configuredHelpClass)
    })

    it('loads help class defined using target and identifier', async () => {
      config.pjson.oclif.helpClass = {
        target: '../test/help/_test-help-class-identifier',
        identifier: 'MyHelp',
      }
      config.root = resolve(__dirname, '..')

      expect(MyHelp).to.not.be.undefined
      expect(await loadHelpClass(config)).to.deep.equal(MyHelp)
    })

    describe('error cases', () => {
      it('throws an error when failing to load the help class defined in pjson.oclif.helpClass', async () => {
        config.pjson.oclif.helpClass = './lib/does-not-exist-help-class'
        await expect(loadHelpClass(config)).to.be.rejectedWith(
          'Unable to load configured help class "./lib/does-not-exist-help-class", failed with message:',
        )
      })
    })
  })

  describe('#standardizeIDFromArgv', () => {
    it('should return standardized id when topic separator is a colon', () => {
      config.topicSeparator = ':'
      const actual = standardizeIDFromArgv(['foo:bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    it('should return standardized id when topic separator is a space', () => {
      const actual = standardizeIDFromArgv(['foo', '', '--baz'], config)
      expect(actual).to.deep.equal(['foo', '', '--baz'])
    })

    it('should return standardized id when topic separator is a space', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    it('should return standardized id when topic separator is a space and command is misspelled', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      const actual = standardizeIDFromArgv(['foo', 'ba', '--baz'], config)
      expect(actual).to.deep.equal(['foo:ba', '--baz'])
    })

    it('should return standardized id when topic separator is a space and has args and command is misspelled', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        args: {
          name: Args.string(),
        },
      })
      const actual = standardizeIDFromArgv(['foo', 'ba', 'baz'], config)
      expect(actual).to.deep.equal(['foo:ba:baz'])
    })

    it('should return standardized id when topic separator is a space and has args', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        args: {
          name: Args.string(),
        },
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz'])
    })

    it('should return standardized id when topic separator is a space and has variable arguments', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        strict: false,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz'])
    })

    it('should return standardized id when topic separator is a space and has variable arguments and flags', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        strict: false,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz', '--hello'], config)
      expect(actual).to.deep.equal(['foo:bar', 'baz', '--hello'])
    })

    it('should return full id when topic separator is a space and does not have arguments', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        args: {},
        strict: true,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
      expect(actual).to.deep.equal(['foo:bar:baz'])
    })

    it('should return standardized id when topic separator is a space and has arg with value', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world'], config)
      expect(actual).to.deep.equal(['foo:bar', 'hello=world'])
    })

    it('should return standardized id when topic separator is a space and has variable args with value', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        strict: false,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world', 'my-arg=value'], config)
      expect(actual).to.deep.equal(['foo:bar', 'hello=world', 'my-arg=value'])
    })

    it('should return standardized id when topic separator is a space and has flags', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        strict: false,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    it('should return standardized id when topic separator is a space and has flags, arg, and arg with value', () => {
      sandbox.stub(util, 'collectUsableIds').returns(new Set(['foo', 'foo:bar']))
      stubCommands({
        id: 'foo:bar',
        args: {
          'my-arg': Args.string(),
        },
        strict: true,
      })
      const actual = standardizeIDFromArgv(['foo', 'bar', 'my-arg', 'hello=world', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', 'my-arg', 'hello=world', '--baz'])
    })
  })
})
