import {test} from '@oclif/test'
import {expect} from 'chai'
import {resolve} from 'node:path'

import {Config, Interfaces} from '../../src'
import * as util from '../../src/config/util'
import {loadHelpClass, standardizeIDFromArgv} from '../../src/help'
import configuredHelpClass from './_test-help-class'

describe('util', () => {
  let config: Interfaces.Config

  beforeEach(async () => {
    config = await Config.load()
  })

  describe('#loadHelpClass', () => {
    test.it('defaults to the class exported', async () => {
      delete config.pjson.oclif.helpClass

      const helpClass = await loadHelpClass(config)
      expect(helpClass).not.be.undefined
      expect(helpClass.prototype.showHelp)
      expect(helpClass.prototype.showCommandHelp)
      expect(helpClass.prototype.formatRoot)
    })

    test.it('loads help class defined in pjson.oclif.helpClass', async () => {
      config.pjson.oclif.helpClass = '../test/help/_test-help-class'
      // @ts-expect-error readonly property
      config.root = resolve(__dirname, '..')

      expect(configuredHelpClass).to.not.be.undefined
      expect(await loadHelpClass(config)).to.deep.equal(configuredHelpClass)
    })

    describe('error cases', () => {
      test.it('throws an error when failing to load the help class defined in pjson.oclif.helpClass', async () => {
        config.pjson.oclif.helpClass = './lib/does-not-exist-help-class'
        await expect(loadHelpClass(config)).to.be.rejectedWith(
          'Unable to load configured help class "./lib/does-not-exist-help-class", failed with message:',
        )
      })
    })
  })

  describe('#standardizeIDFromArgv', () => {
    test.it('should return standardized id when topic separator is a colon', () => {
      config.pjson.oclif.topicSeparator = ':'
      const actual = standardizeIDFromArgv(['foo:bar', '--baz'], config)
      expect(actual).to.deep.equal(['foo:bar', '--baz'])
    })

    test.it('should return standardized id when topic separator is a space', () => {
      config.topicSeparator = ' '
      const actual = standardizeIDFromArgv(['foo', '', '--baz'], config)
      expect(actual).to.deep.equal(['foo', '', '--baz'])
    })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space', () => {
        config.topicSeparator = ' '
        const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
        expect(actual).to.deep.equal(['foo:bar', '--baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and command is misspelled', () => {
        config.topicSeparator = ' '
        const actual = standardizeIDFromArgv(['foo', 'ba', '--baz'], config)
        expect(actual).to.deep.equal(['foo:ba', '--baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it(
        'should return standardized id when topic separator is a space and has args and command is misspelled',
        () => {
          config.topicSeparator = ' '
          // @ts-expect-error private member
          config._commands.set('foo:bar', {
            id: 'foo:bar',
            args: [{name: 'first'}],
          })
          const actual = standardizeIDFromArgv(['foo', 'ba', 'baz'], config)
          expect(actual).to.deep.equal(['foo:ba:baz'])
        },
      )

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has args', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {
          id: 'foo:bar',
          args: [{name: 'first'}],
        })
        const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
        expect(actual).to.deep.equal(['foo:bar', 'baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has variable arguments', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {
          id: 'foo:bar',
          strict: false,
        })
        const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
        expect(actual).to.deep.equal(['foo:bar', 'baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has variable arguments and flags', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {
          id: 'foo:bar',
          strict: false,
        })
        const actual = standardizeIDFromArgv(['foo', 'bar', 'baz', '--hello'], config)
        expect(actual).to.deep.equal(['foo:bar', 'baz', '--hello'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return full id when topic separator is a space and does not have arguments', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {
          id: 'foo:bar',
          args: [],
          strict: true,
        })
        const actual = standardizeIDFromArgv(['foo', 'bar', 'baz'], config)
        expect(actual).to.deep.equal(['foo:bar:baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has arg with value', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {id: 'foo:bar'})
        const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world'], config)
        expect(actual).to.deep.equal(['foo:bar', 'hello=world'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has variable args with value', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {id: 'foo:bar', strict: false})
        const actual = standardizeIDFromArgv(['foo', 'bar', 'hello=world', 'my-arg=value'], config)
        expect(actual).to.deep.equal(['foo:bar', 'hello=world', 'my-arg=value'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it('should return standardized id when topic separator is a space and has flags', () => {
        config.topicSeparator = ' '
        // @ts-expect-error private member
        config._commands.set('foo:bar', {id: 'foo:bar'})
        const actual = standardizeIDFromArgv(['foo', 'bar', '--baz'], config)
        expect(actual).to.deep.equal(['foo:bar', '--baz'])
      })

    test
      .stub(util, 'collectUsableIds', (stub) => stub.returns(new Set(['foo', 'foo:bar'])))
      .it(
        'should return standardized id when topic separator is a space and has flags, arg, and arg with value',
        () => {
          config.topicSeparator = ' '
          // @ts-expect-error private member
          config._commands.set('foo:bar', {
            id: 'foo:bar',
            args: [{name: 'my-arg'}],
            strict: true,
          })
          const actual = standardizeIDFromArgv(['foo', 'bar', 'my-arg', 'hello=world', '--baz'], config)
          expect(actual).to.deep.equal(['foo:bar', 'my-arg', 'hello=world', '--baz'])
        },
      )
  })
})
