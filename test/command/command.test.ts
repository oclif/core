import {expect, fancy} from 'fancy-test'
// import path = require('path')

import {Args, Command as Base, Flags, toCached} from '../../src'
// import {TestHelpClassConfig} from './helpers/test-help-in-src/src/test-help-plugin'

// const pjson = require('../package.json')
// const root = path.resolve(__dirname, '../../package.json')

class Command extends Base {
  static description = 'test command'

  async run() {
    this.parse()
    this.log('foo')
  }
}

class CodeError extends Error {
  constructor(private readonly code: string) {
    super(code)
  }
}

describe('command', () => {
  fancy
  .stdout()
  .do(() => Command.run([]))
  .do(output => expect(output.stdout).to.equal('foo\n'))
  .it('logs to stdout')

  fancy
  .do(async () => {
    class Command extends Base {
      static description = 'test command'

      async run() {
        return 101
      }
    }

    expect(await Command.run([])).to.equal(101)
  })
  .it('returns value')

  fancy
  .do(() => {
    class Command extends Base {
      async run() {
        throw new Error('new x error')
      }
    }

    return Command.run([])
  })
  .catch(/new x error/)
  .it('errors out')

  fancy
  .stdout()
  .do(() => {
    class Command extends Base {
      async run() {
        this.exit(0)
      }
    }
    return Command.run([])
  })
  .catch(/EEXIT: 0/)
  .it('exits with 0')

  describe('toCached', () => {
    fancy
    .do(async () => {
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
      }

      const c = await toCached(C)

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
        flags: {
          flaga: {
            aliases: undefined,
            char: undefined,
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
          },
          flagb: {
            aliases: undefined,
            char: 'b',
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
          },
        },
      })
    })
    .it('converts to cached with everything set')

    fancy
    // .skip()
    .do(async () => {
      // const c = class extends Command {
      // }.convertToCached()
      // expect(await c.load()).to.have.property('run')
      // delete c.load
      // expect(c).to.deep.equal({
      //   _base: `@oclif/command@${pjson.version}`,
      //   id: undefined,
      //   type: undefined,
      //   hidden: undefined,
      //   pluginName: undefined,
      //   description: 'test command',
      //   aliases: [],
      //   title: undefined,
      //   usage: undefined,
      //   flags: {},
      //   args: [],
      // })
    })

    .it('adds plugin name')

    fancy
    // .skip()
    // .do(async () => {
    //   const c = class extends Command {
    //   }.convertToCached({pluginName: 'myplugin'})
    //   expect(await c.load()).to.have.property('run')
    //   delete c.load
    //   expect(c).to.deep.equal({
    //     _base: `@oclif/command@${pjson.version}`,
    //     type: undefined,
    //     id: undefined,
    //     hidden: undefined,
    //     pluginName: 'myplugin',
    //     description: 'test command',
    //     aliases: [],
    //     title: undefined,
    //     usage: undefined,
    //     flags: {},
    //     args: [],
    //   })
    // })
    .it('converts to cached with nothing set')
  })

  describe('parse', () => {
    fancy
    .stdout()
    .it('has a flag', async ctx => {
      class CMD extends Base {
        static flags = {
          foo: Flags.string(),
        }

        async run() {
          const {flags} = await this.parse(CMD)
          this.log(flags.foo)
        }
      }

      await CMD.run(['--foo=bar'])
      expect(ctx.stdout).to.equal('bar\n')
    })
  })

  describe('.log()', () => {
    fancy
    .stdout()
    .do(async () => {
      class CMD extends Command {
        async run() {
          this.log('json output: %j', {a: 'foobar'})
        }
      }
      await CMD.run([])
    })
    .do(ctx => expect(ctx.stdout).to.equal('json output: {"a":"foobar"}\n'))
    .it('uses util.format()')
  })

  describe('flags with deprecated aliases', () => {
    class CMD extends Command {
      static flags = {
        name: Flags.string({
          aliases: ['username', 'target-user', 'u'],
          deprecateAliases: true,
          char: 'o',
        }),
        other: Flags.string(),
      }

      async run() {
        await this.parse(CMD)
        this.log('running command')
      }
    }

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['--username', 'astro']))
    .do(ctx => expect(ctx.stderr).to.include('Warning: The "--username" flag has been deprecated. Use "--name | -o"'))
    .it('shows warning for deprecated flag alias')

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['--target-user', 'astro']))
    .do(ctx => expect(ctx.stderr).to.include('Warning: The "--target-user" flag has been deprecated. Use "--name | -o"'))
    .it('shows warning for deprecated flag alias')

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['-u', 'astro']))
    .do(ctx => expect(ctx.stderr).to.include('Warning: The "-u" flag has been deprecated. Use "--name | -o"'))
    .it('shows warning for deprecated short char flag alias')

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['--name', 'username']))
    .do(ctx => expect(ctx.stderr).to.be.empty)
    .it('shows no warning when using proper flag name with a value that matches a flag alias')

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['--other', 'target-user']))
    .do(ctx => expect(ctx.stderr).to.be.empty)
    .it('shows no warning when using another flag with a value that matches a deprecated flag alias')

    fancy
    .stdout()
    .stderr()
    .do(async () => CMD.run(['--name', 'u']))
    .do(ctx => expect(ctx.stderr).to.be.empty)
    .it('shows no warning when proper flag name with a value that matches a short char flag alias')
  })

  describe('deprecated flags', () => {
    fancy
    .stdout()
    .stderr()
    .do(async () => {
      class CMD extends Command {
        static flags = {
          name: Flags.string({
            deprecated: {
              to: '--full-name',
              version: '2.0.0',
            },
          }),
          force: Flags.boolean(),
        }

        async run() {
          await this.parse(CMD)
          this.log('running command')
        }
      }
      await CMD.run(['--name', 'astro'])
    })
    .do(ctx => expect(ctx.stderr).to.include('Warning: The "name" flag has been deprecated'))
    .it('shows warning for deprecated flags')
  })

  describe('deprecated flags that are not provided', () => {
    fancy
    .stdout()
    .stderr()
    .do(async () => {
      class CMD extends Command {
        static flags = {
          name: Flags.string({
            deprecated: {
              to: '--full-name',
              version: '2.0.0',
            },
          }),
          force: Flags.boolean(),
        }

        async run() {
          await this.parse(CMD)
          this.log('running command')
        }
      }
      await CMD.run(['--force'])
    })
    .do(ctx => expect(ctx.stderr).to.not.include('Warning: The "name" flag has been deprecated'))
    .it('does not show warning for deprecated flags if they are not provided')
  })

  describe('deprecated state', () => {
    fancy
    .stdout()
    .stderr()
    .do(async () => {
      class CMD extends Command {
        static id = 'my:command'
        static state = 'deprecated'
        async run() {
          this.log('running command')
        }
      }
      await CMD.run([])
    })
    .do(ctx => expect(ctx.stderr).to.include('Warning: The "my:command" command has been deprecated'))
    .it('shows warning for deprecated command')
  })

  describe('deprecated state with options', () => {
    fancy
    .stdout()
    .stderr()
    .do(async () => {
      class CMD extends Command {
        static id = 'my:command'
        static state = 'deprecated'
        static deprecationOptions = {
          version: '2.0.0',
          to: 'my:other:command',
        }

        async run() {
          this.log('running command')
        }
      }
      await CMD.run([])
    })
    .do(ctx => {
      expect(ctx.stderr).to.include('Warning: The "my:command" command has been deprecated')
      expect(ctx.stderr).to.include('in version 2.0.0')
      expect(ctx.stderr).to.include('Use "my:other:command" instead')
    })
    .it('shows warning for deprecated command with custom options')
  })

  describe('stdout err', () => {
    fancy
    .stdout()
    .do(async () => {
      class CMD extends Command {
        async run() {
          process.stdout.emit('error', new CodeError('dd'))
        }
      }
      await CMD.run([])
    })
    .catch(/dd/)
    .it('test stdout error throws')

    fancy
    .stdout()
    .do(async () => {
      class CMD extends Command {
        async run() {
          process.stdout.emit('error', new CodeError('EPIPE'))
          this.log('json output: %j', {a: 'foobar'})
        }
      }
      await CMD.run([])
    })
    .do(ctx => expect(ctx.stdout).to.equal('json output: {"a":"foobar"}\n'))
    .it('test stdout EPIPE swallowed')
  })
})
