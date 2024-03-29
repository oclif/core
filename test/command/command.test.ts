import {expect, fancy} from 'fancy-test'

// import path = require('path')
import {Command as Base, Flags} from '../../src'
import {ensureArgObject} from '../../src/util/ensure-arg-object'
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
    .do((output) => expect(output.stdout).to.equal('foo\n'))
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

  describe('parse', () => {
    fancy.stdout().it('has a flag', async (ctx) => {
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
      .do((ctx) => expect(ctx.stdout).to.equal('json output: {"a":"foobar"}\n'))
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
      .do((ctx) =>
        expect(ctx.stderr).to.include('Warning: The "--username" flag has been deprecated. Use "--name | -o"'),
      )
      .it('shows warning for deprecated flag alias')

    fancy
      .stdout()
      .stderr()
      .do(async () => CMD.run(['--target-user', 'astro']))
      .do((ctx) =>
        expect(ctx.stderr).to.include('Warning: The "--target-user" flag has been deprecated. Use "--name | -o"'),
      )
      .it('shows warning for deprecated flag alias')

    fancy
      .stdout()
      .stderr()
      .do(async () => CMD.run(['-u', 'astro']))
      .do((ctx) => expect(ctx.stderr).to.include('Warning: The "-u" flag has been deprecated. Use "--name | -o"'))
      .it('shows warning for deprecated short char flag alias')

    fancy
      .stdout()
      .stderr()
      .do(async () => CMD.run(['--name', 'username']))
      .do((ctx) => expect(ctx.stderr).to.be.empty)
      .it('shows no warning when using proper flag name with a value that matches a flag alias')

    fancy
      .stdout()
      .stderr()
      .do(async () => CMD.run(['--other', 'target-user']))
      .do((ctx) => expect(ctx.stderr).to.be.empty)
      .it('shows no warning when using another flag with a value that matches a deprecated flag alias')

    fancy
      .stdout()
      .stderr()
      .do(async () => CMD.run(['--name', 'u']))
      .do((ctx) => expect(ctx.stderr).to.be.empty)
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
      .do((ctx) => expect(ctx.stderr).to.include('Warning: The "name" flag has been deprecated'))
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
      .do((ctx) => expect(ctx.stderr).to.not.include('Warning: The "name" flag has been deprecated'))
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
      .do((ctx) => expect(ctx.stderr).to.include('Warning: The "my:command" command has been deprecated'))
      .it('shows warning for deprecated command')
  })

  describe('deprecated state with options', () => {
    fancy
      .stdout()
      .stderr()
      .do(async () => {
        class CMD extends Command {
          static deprecationOptions = {
            version: '2.0.0',
            to: 'my:other:command',
          }

          static id = 'my:command'
          static state = 'deprecated'

          async run() {
            this.log('running command')
          }
        }

        await CMD.run([])
      })
      .do((ctx) => {
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
      .do((ctx) => expect(ctx.stdout).to.equal('json output: {"a":"foobar"}\n'))
      .it('test stdout EPIPE swallowed')
  })
  describe('json enabled and pass-through tests', () => {
    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {
            this.log('not json output')
          }
        }

        const cmd = new CMD([], {} as any)
        expect(cmd.jsonEnabled()).to.equal(false)
      })
      .it('json enabled/pass through disabled/no --json flag/jsonEnabled() should be false')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {}
        }

        const cmd = new CMD(['--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(true)
      })
      .it('json enabled/pass through disabled/--json flag before --/jsonEnabled() should be true')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true
          async run() {}
        }

        // mock a scopedEnvVar being set to JSON
        const cmd = new CMD([], {
          bin: 'FOO',
          scopedEnvVar: (foo: string) => (foo.includes('CONTENT_TYPE') ? 'json' : undefined),
        } as any)
        expect(cmd.jsonEnabled()).to.equal(true)
      })
      .it('json enabled from env')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {
            const {flags} = await cmd.parse(CMD, ['--json'])
            expect(flags.json).to.equal(true, 'json flag should be true')
          }
        }

        const cmd = new CMD(['--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(true)
      })
      .it('json enabled/pass through enabled/--json flag before --/jsonEnabled() should be true')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {
            const {flags} = await cmd.parse(CMD, ['--', '--json'])
            expect(flags.json).to.equal(false, 'json flag should be false')
            // expect(this.passThroughEnabled).to.equal(true, 'pass through should be true')
          }
        }

        const cmd = new CMD(['--', '--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(false)
      })
      .it('json enabled/pass through enabled/--json flag after --/jsonEnabled() should be false')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {
            const {flags} = await cmd.parse(CMD, ['--foo', '--json'])
            expect(flags.json).to.equal(true, 'json flag should be true')
          }
        }

        const cmd = new CMD(['foo', '--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(true)
      })
      .it('json enabled/pass through enabled/--json flag before --/extra param/jsonEnabled() should be true')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {
            const {flags} = await cmd.parse(CMD, ['--foo', '--', '--json'])
            expect(flags.json).to.equal(false, 'json flag should be false')
            // expect(this.passThroughEnabled).to.equal(true, 'pass through should be true')
          }
        }

        const cmd = new CMD(['--foo', '--', '--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(false)
      })
      .it('json enabled/pass through enabled/--json flag after --/extra param/jsonEnabled() should be false')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static enableJsonFlag = true

          async run() {}
        }

        const cmd = new CMD(['--json', '--'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(true)
      })
      .it('json enabled/pass through enabled/--json flag before --/jsonEnabled() should be true')

    fancy
      .stdout()
      .do(async () => {
        class CMD extends Command {
          static '--' = true
          static enableJsonFlag = false

          async run() {}
        }

        const cmd = new CMD(['--json'], {} as any)
        expect(cmd.jsonEnabled()).to.equal(false)
      })
      .it('json disabled/pass through enable/--json flag before --/jsonEnabled() should be false')
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
