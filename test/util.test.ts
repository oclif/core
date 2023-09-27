import {expect} from 'chai'
import {homedir} from 'node:os'
import {Args, Command, Flags} from '../src/index'
import {capitalize, castArray, ensureArgObject, getHomeDir, isNotFalsy, isTruthy, last, maxBy, readJson, sumBy} from '../src/util'
import {defaultToCached} from '../src/util/default-to-cached'
import {toCached} from '../src/util/to-cached'

describe('capitalize', () => {
  it('capitalizes the string', () => {
    expect(capitalize('dominik')).to.equal('Dominik')
  })
  it('works with an empty string', () => {
    expect(capitalize('')).to.equal('')
  })
})

type Item = { x: number }

describe('sumBy', () => {
  it('returns zero for empty array', () => {
    const arr: Item[] = []
    expect(sumBy(arr, i => i.x)).to.equal(0)
  })
  it('returns sum for non-empty array', () => {
    const arr: Item[] = [{x: 1}, {x: 2}, {x: 3}]
    expect(sumBy(arr, i => i.x)).to.equal(6)
  })
})

describe('maxBy', () => {
  it('returns undefined for empty array', () => {
    const arr: Item[] = []
    expect(maxBy(arr, i => i.x)).to.be.undefined
  })
  it('returns max value in the array', () => {
    const arr: Item[] = [{x: 1}, {x: 3}, {x: 2}]
    expect(maxBy(arr, i => i.x)).to.equal(arr[1])
  })
})

describe('last', () => {
  it('returns undefined for empty array', () => {
    expect(last([])).to.be.undefined
  })
  it('returns undefined for undefined', () => {
    expect(last()).to.be.undefined
  })
  it('returns last value in the array', () => {
    const arr: Item[] = [{x: 1}, {x: 3}, {x: 2}]
    expect(last(arr)).to.equal(arr[2])
  })
  it('returns only item in array', () => {
    expect(last([6])).to.equal(6)
  })
})

describe('ensureArgObject', () => {
  it('should convert array of arguments to an object', () => {
    const args = [
      {name: 'foo', description: 'foo desc', required: true},
      {name: 'bar', description: 'bar desc'},
    ]
    const expected = {foo: args[0], bar: args[1]}
    expect(ensureArgObject(args)).to.deep.equal(expected)
  })

  it('should do nothing to an arguments object', () => {
    const args = {
      foo: {name: 'foo', description: 'foo desc', required: true},
      bar: {name: 'bar', description: 'bar desc'},
    }
    expect(ensureArgObject(args)).to.deep.equal(args)
  })
})

describe('isNotFalsy', () => {
  it('should return true for truthy values', () => {
    expect(isNotFalsy('true')).to.be.true
    expect(isNotFalsy('1')).to.be.true
    expect(isNotFalsy('yes')).to.be.true
    expect(isNotFalsy('y')).to.be.true
  })

  it('should return false for falsy values', () => {
    expect(isNotFalsy('false')).to.be.false
    expect(isNotFalsy('0')).to.be.false
    expect(isNotFalsy('no')).to.be.false
    expect(isNotFalsy('n')).to.be.false
  })
})

describe('isTruthy', () => {
  it('should return true for truthy values', () => {
    expect(isTruthy('true')).to.be.true
    expect(isTruthy('1')).to.be.true
    expect(isTruthy('yes')).to.be.true
    expect(isTruthy('y')).to.be.true
  })

  it('should return false for falsy values', () => {
    expect(isTruthy('false')).to.be.false
    expect(isTruthy('0')).to.be.false
    expect(isTruthy('no')).to.be.false
    expect(isTruthy('n')).to.be.false
  })
})

describe('getHomeDir', () => {
  it('should return the home directory', () => {
    expect(getHomeDir()).to.equal(homedir())
  })
})

describe('readJson', () => {
  it('should return parsed JSON', async () => {
    const json = await readJson<{name: string}>('package.json')
    expect(json.name).to.equal('@oclif/core')
  })

  it('should throw an error if the file does not exist', async () => {
    try {
      await readJson('does-not-exist.json')
      throw new Error('Expected an error to be thrown')
    } catch (error) {
      const err = error as Error
      expect(err.message).to.include('ENOENT: no such file or directory')
    }
  })
})

describe('castArray', () => {
  it('should cast a value to an array', () => {
    expect(castArray('foo')).to.deep.equal(['foo'])
  })

  it('should return an array if the value is an array', () => {
    expect(castArray(['foo'])).to.deep.equal(['foo'])
  })

  it('should return an empty array if the value is undefined', () => {
    expect(castArray()).to.deep.equal([])
  })
})

describe('defaultToCached', () => {
  it('should do nothing if noCacheDefault is true', async () => {
    const flag = {noCacheDefault: true}
    const result = await defaultToCached(flag as any, true)
    expect(result).to.be.undefined
  })

  it('should do nothing if respectNoCacheDefault is true', async () => {
    const result = await defaultToCached({} as any, true)
    expect(result).to.be.undefined
  })

  it('should return the result of defaultHelp if it exists', async () => {
    const flag = {defaultHelp: async () => 'foo'}
    const result = await defaultToCached(flag as any, false)
    expect(result).to.equal('foo')
  })

  it('should return undefined if defaultHelp throws', async () => {
    const flag = {async defaultHelp() {
      throw new Error('foo')
    }}
    const result = await defaultToCached(flag as any, false)
    expect(result).to.be.undefined
  })

  it('should return the result of the default if it\'s a function', async () => {
    const flag = {default: async () => 'foo'}
    const result = await defaultToCached(flag as any, false)
    expect(result).to.equal('foo')
  })

  it('should return the result of the default if it\'s a simple value', async () => {
    const flag = {default: 'foo'}
    const result = await defaultToCached(flag as any, false)
    expect(result).to.equal('foo')
  })
})

describe('toCached', () => {
  it('should return a cached command with every thing set', async () => {
    class C extends Command {
      static id = 'foo:bar'
      static title = 'cmd title'
      static type = 'mytype'
      static usage = ['$ usage']
      static description = 'test command'
      static aliases = ['alias1', 'alias2']
      static hidden = true
      static flags = {
        flaga: Flags.boolean(),
        flagb: Flags.string({
          char: 'b',
          hidden: true,
          required: false,
          description: 'flagb desc',
          options: ['a', 'b'],
          default: async () => 'a',
        }),
        flagc: Flags.integer({
          char: 'c',
          min: 1,
          max: 10,
          required: false,
          description: 'flagc desc',
          options: ['a', 'b'],
          default: async context => (context.options.min ?? 1) + 1,
        }),
      }

      static args = {
        arg1: Args.string({
          description: 'arg1 desc',
          required: true,
          hidden: false,
          options: ['af', 'b'],
          default: async () => 'a',
        }),
      }

      public async run(): Promise<void> {}
    }
    const c = await toCached(C, undefined, false)
    expect(c).to.deep.equal({
      id: 'foo:bar',
      type: 'mytype',
      hidden: true,
      pluginName: undefined,
      pluginAlias: undefined,
      pluginType: undefined,
      state: undefined,
      description: 'test command',
      aliases: ['alias1', 'alias2'],
      title: 'cmd title',
      usage: ['$ usage'],
      examples: undefined,
      deprecationOptions: undefined,
      deprecateAliases: undefined,
      summary: undefined,
      strict: true,
      enableJsonFlag: false,
      hasDynamicHelp: false,
      flags: {
        flaga: {
          aliases: undefined,
          char: undefined,
          charAliases: undefined,
          description: undefined,
          dependsOn: undefined,
          deprecateAliases: undefined,
          deprecated: undefined,
          exclusive: undefined,
          helpGroup: undefined,
          helpLabel: undefined,
          summary: undefined,
          name: 'flaga',
          hidden: undefined,
          required: undefined,
          relationships: undefined,
          allowNo: false,
          type: 'boolean',
          delimiter: undefined,
          noCacheDefault: undefined,
        },
        flagb: {
          aliases: undefined,
          char: 'b',
          charAliases: undefined,
          description: 'flagb desc',
          dependsOn: undefined,
          deprecateAliases: undefined,
          deprecated: undefined,
          exclusive: undefined,
          helpGroup: undefined,
          helpLabel: undefined,
          summary: undefined,
          name: 'flagb',
          hidden: true,
          required: false,
          multiple: false,
          relationships: undefined,
          type: 'option',
          helpValue: undefined,
          default: 'a',
          options: ['a', 'b'],
          delimiter: undefined,
          noCacheDefault: undefined,
        },
        flagc: {
          aliases: undefined,
          char: 'c',
          charAliases: undefined,
          default: 2,
          delimiter: undefined,
          dependsOn: undefined,
          deprecateAliases: undefined,
          deprecated: undefined,
          description: 'flagc desc',
          exclusive: undefined,
          helpGroup: undefined,
          helpLabel: undefined,
          helpValue: undefined,
          hidden: undefined,
          multiple: false,
          name: 'flagc',
          options: [
            'a',
            'b',
          ],
          relationships: undefined,
          required: false,
          summary: undefined,
          type: 'option',
          noCacheDefault: undefined,
        },

      },
      args: {
        arg1: {
          description: 'arg1 desc',
          name: 'arg1',
          hidden: false,
          required: true,
          options: ['af', 'b'],
          default: 'a',
          noCacheDefault: undefined,
        },
      },
    })
  })

  it('should return a cached command with multiple Command classes in inheritance chain', async () => {
    class Base extends Command {
      public static enableJsonFlag = true
      public static aliases = ['base']
      public static state = 'beta'
      public static summary = 'base summary'
      public static baseFlags = {
        parentFlag: Flags.boolean(),
      }

      public async run(): Promise<void> {}
    }

    class Child extends Base {
      static id = 'command'
      public static summary = 'child summary'
      static flags = {
        childFlag: Flags.boolean(),
      }

      public async run(): Promise<void> {}
    }

    const cached = await toCached(Child, undefined, false)

    expect(cached).to.deep.equal({
      id: 'command',
      summary: 'child summary',
      description: undefined,
      strict: true,
      usage: undefined,
      pluginName: undefined,
      pluginAlias: undefined,
      pluginType: undefined,
      hidden: undefined,
      state: 'beta',
      aliases: ['base'],
      examples: undefined,
      deprecationOptions: undefined,
      deprecateAliases: undefined,
      flags: {
        json: {
          name: 'json',
          type: 'boolean',
          char: undefined,
          summary: undefined,
          description: 'Format output as json.',
          hidden: undefined,
          required: undefined,
          helpLabel: undefined,
          helpGroup: 'GLOBAL',
          allowNo: false,
          dependsOn: undefined,
          relationships: undefined,
          exclusive: undefined,
          deprecated: undefined,
          deprecateAliases: undefined,
          aliases: undefined,
          charAliases: undefined,
          delimiter: undefined,
          noCacheDefault: undefined,
        },
        childFlag: {
          name: 'childFlag',
          type: 'boolean',
          char: undefined,
          summary: undefined,
          description: undefined,
          hidden: undefined,
          required: undefined,
          helpLabel: undefined,
          helpGroup: undefined,
          allowNo: false,
          dependsOn: undefined,
          relationships: undefined,
          exclusive: undefined,
          deprecated: undefined,
          deprecateAliases: undefined,
          aliases: undefined,
          charAliases: undefined,
          delimiter: undefined,
          noCacheDefault: undefined,
        },
        parentFlag: {
          name: 'parentFlag',
          type: 'boolean',
          char: undefined,
          summary: undefined,
          description: undefined,
          hidden: undefined,
          required: undefined,
          helpLabel: undefined,
          helpGroup: undefined,
          allowNo: false,
          dependsOn: undefined,
          relationships: undefined,
          exclusive: undefined,
          deprecated: undefined,
          deprecateAliases: undefined,
          aliases: undefined,
          charAliases: undefined,
          delimiter: undefined,
          noCacheDefault: undefined,
        },
      },
      args: {},
      hasDynamicHelp: false,
      enableJsonFlag: true,
    })
  })

  it('should set dynamicHelp to true if defaultHelp is a function', async () => {
    class C extends Command {
      static id = 'foo:bar'
      static flags = {
        flaga: Flags.boolean(),
        flagb: Flags.string({
          defaultHelp: async () => 'foo',
        }),
      }

      public async run(): Promise<void> {}
    }
    const c = await toCached(C, undefined, false)
    expect(c.hasDynamicHelp).to.be.true
  })
})
