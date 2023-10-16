import {expect} from 'chai'

import {Args, Command, Flags} from '../../src/index'
import {cacheCommand} from '../../src/util/cache-command'

describe('cacheCommand', () => {
  it('should return a cached command with every thing set', async () => {
    class C extends Command {
      static aliases = ['alias1', 'alias2']
      static args = {
        arg1: Args.string({
          description: 'arg1 desc',
          required: true,
          hidden: false,
          options: ['af', 'b'],
          default: async () => 'a',
        }),
      }

      static description = 'test command'
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
          env: 'FLAGC',
          required: false,
          description: 'flagc desc',
          options: ['a', 'b'],
          default: async (context) => (context.options.min ?? 1) + 1,
        }),
      }

      static hidden = true
      static id = 'foo:bar'
      static title = 'cmd title'
      static type = 'mytype'

      static usage = ['$ usage']

      public async run(): Promise<void> {}
    }
    const c = await cacheCommand(C, undefined, false)
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
      hiddenAliases: [],
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
          env: undefined,
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
          env: undefined,
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
          hasDynamicHelp: false,
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
          env: 'FLAGC',
          exclusive: undefined,
          helpGroup: undefined,
          helpLabel: undefined,
          helpValue: undefined,
          hidden: undefined,
          multiple: false,
          name: 'flagc',
          options: ['a', 'b'],
          relationships: undefined,
          required: false,
          summary: undefined,
          type: 'option',
          noCacheDefault: undefined,
          hasDynamicHelp: false,
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
      public static aliases = ['base']
      public static baseFlags = {
        parentFlag: Flags.boolean(),
      }

      public static enableJsonFlag = true
      public static state = 'beta'
      public static summary = 'base summary'

      public async run(): Promise<void> {}
    }

    class Child extends Base {
      static flags = {
        childFlag: Flags.boolean(),
      }

      static id = 'command'
      public static summary = 'child summary'

      public async run(): Promise<void> {}
    }

    const cached = await cacheCommand(Child, undefined, false)

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
      hiddenAliases: [],
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
          env: undefined,
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
          noCacheDefault: undefined,
        },
        childFlag: {
          name: 'childFlag',
          type: 'boolean',
          char: undefined,
          summary: undefined,
          description: undefined,
          env: undefined,
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
          noCacheDefault: undefined,
        },
        parentFlag: {
          name: 'parentFlag',
          type: 'boolean',
          char: undefined,
          summary: undefined,
          description: undefined,
          env: undefined,
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
      static flags = {
        flaga: Flags.boolean(),
        flagb: Flags.string({
          defaultHelp: async () => 'foo',
        }),
      }

      static id = 'foo:bar'

      public async run(): Promise<void> {}
    }
    const c = await cacheCommand(C, undefined, false)
    expect(c.hasDynamicHelp).to.be.true
    expect(c.flags.flagb.hasDynamicHelp).to.be.true
  })

  it('should add additional command properties', async () => {
    class C extends Command {
      static envVars = ['FOO_BAR']
      static flags = {
        flaga: Flags.boolean(),
      }

      static id = 'foo:bar'

      public async run(): Promise<void> {}
    }

    const c = await cacheCommand(C, undefined, false)
    expect(c.envVars).to.deep.equal(['FOO_BAR'])
  })
})
