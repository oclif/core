import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import {Command as Base, Flags} from '../../src'

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
  it('logs to stdout', async () => {
    const {stdout} = await captureOutput(async () => Command.run([]))
    expect(stdout).to.equal('foo\n')
  })

  it('returns value', async () => {
    class Command extends Base {
      static description = 'test command'

      async run() {
        return 101
      }
    }

    const {result} = await captureOutput(async () => Command.run([]))
    expect(result).to.equal(101)
  })

  it('errors out', async () => {
    class Command extends Base {
      async run() {
        throw new Error('new x error')
      }
    }

    const {error} = await captureOutput(async () => Command.run([]))
    expect(error?.message).to.equal('new x error')
  })

  it('exits with 0', async () => {
    class Command extends Base {
      async run() {
        this.exit(0)
      }
    }

    const {error} = await captureOutput(async () => Command.run([]))
    expect(error?.code).to.equal('EEXIT')
    expect(error?.oclif?.exit).to.equal(0)
  })

  describe('parse', () => {
    it('has a flag', async () => {
      class CMD extends Base {
        static flags = {
          foo: Flags.string(),
        }

        async run() {
          const {flags} = await this.parse(CMD)
          this.log(flags.foo)
        }
      }

      const {stdout} = await captureOutput(async () => CMD.run(['--foo=bar']))
      expect(stdout).to.equal('bar\n')
    })
  })

  describe('.log()', () => {
    it('uses util.format()', async () => {
      class CMD extends Base {
        async run() {
          this.log('json output: %j', {a: 'foobar'})
        }
      }

      const {stdout} = await captureOutput(async () => CMD.run([]))
      expect(stdout).to.equal('json output: {"a":"foobar"}\n')
    })
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

    it('shows warning for deprecated flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['--username', 'astro']))
      expect(stderr).to.include('Warning: The "--username" flag has been deprecated. Use "--name | -o"')
    })

    it('shows warning for deprecated flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['--target-user', 'astro']))
      expect(stderr).to.include('Warning: The "--target-user" flag has been deprecated. Use "--name | -o"')
    })

    it('shows warning for deprecated short char flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['-u', 'astro']))
      expect(stderr).to.include('Warning: The "-u" flag has been deprecated. Use "--name | -o"')
    })

    it('shows no warning when using proper flag name with a value that matches a flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['--name', 'username']))
      expect(stderr).to.be.empty
    })

    it('shows no warning when using another flag with a value that matches a deprecated flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['--other', 'target-user']))
      expect(stderr).to.be.empty
    })

    it('shows no warning when proper flag name with a value that matches a short char flag alias', async () => {
      const {stderr} = await captureOutput(async () => CMD.run(['--name', 'u']))
      expect(stderr).to.be.empty
    })
  })

  describe('deprecated flags', () => {
    it('shows warning for deprecated flags', async () => {
      class CMD extends Command {
        static flags = {
          name: Flags.string({
            deprecated: {
              to: '--full-name',
            },
          }),
          force: Flags.boolean(),
        }

        async run() {
          await this.parse(CMD)
          this.log('running command')
        }
      }

      const {stderr} = await captureOutput(async () => CMD.run(['--name', 'astro']))
      expect(stderr).to.include('Warning: The "name" flag has been deprecated. Use "--full-name"')
    })
  })

  describe('deprecated flags that are not provided', () => {
    it('does not show warning for deprecated flags if they are not provided', async () => {
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

      const {stderr} = await captureOutput(async () => CMD.run(['--force']))
      expect(stderr).to.not.include('Warning: The "name" flag has been deprecated')
    })
  })

  describe('deprecated state', () => {
    it('shows warning for deprecated command', async () => {
      class CMD extends Command {
        static id = 'my:command'
        static state = 'deprecated'

        async run() {
          this.log('running command')
        }
      }

      const {stderr} = await captureOutput(async () => CMD.run([]))
      expect(stderr).to.include('Warning: The "my:command" command has been deprecated')
    })
  })

  describe('deprecated state with options', () => {
    it('shows warning for deprecated command with custom options', async () => {
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

      const {stderr} = await captureOutput(async () => CMD.run([]))
      expect(stderr).to.include('Warning: The "my:command" command has been deprecated')
      expect(stderr).to.include('in version 2.0.0')
      expect(stderr).to.include('Use "my:other:command" instead')
    })
  })

  describe('stdout err', () => {
    it('handles errors thrown from stdout', async () => {
      class CMD extends Command {
        async run() {
          process.stdout.emit('error', new CodeError('dd'))
        }
      }

      const {error} = await captureOutput(async () => CMD.run([]))
      expect(error?.message).to.equal('dd')
    })

    it('handles EPIPE errors', async () => {
      class CMD extends Command {
        async run() {
          process.stdout.emit('error', new CodeError('EPIPE'))
          this.log('json output: %j', {a: 'foobar'})
        }
      }

      const {stdout} = await captureOutput(async () => CMD.run([]))
      expect(stdout).to.equal('json output: {"a":"foobar"}\n')
    })
  })

  describe('json enabled and pass-through tests', () => {
    it('json enabled/pass through disabled/no --json flag/jsonEnabled() should be false', async () => {
      class CMD extends Command {
        static enableJsonFlag = true

        async run() {
          this.log('not json output')
        }
      }

      const cmd = new CMD([], {} as any)
      expect(cmd.jsonEnabled()).to.equal(false)
    })

    it('json enabled/pass through disabled/--json flag before --/jsonEnabled() should be true', async () => {
      class CMD extends Command {
        static enableJsonFlag = true

        async run() {}
      }

      const cmd = new CMD(['--json'], {} as any)
      expect(cmd.jsonEnabled()).to.equal(true)
    })

    it('json enabled from env', async () => {
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

    it('json enabled/pass through enabled/--json flag before --/jsonEnabled() should be true', async () => {
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

    it('json enabled/pass through enabled/--json flag after --/jsonEnabled() should be false', async () => {
      class CMD extends Command {
        static enableJsonFlag = true

        async run() {
          const {flags} = await cmd.parse(CMD, ['--', '--json'])
          expect(flags.json).to.equal(false, 'json flag should be false')
        }
      }

      const cmd = new CMD(['--', '--json'], {} as any)
      expect(cmd.jsonEnabled()).to.equal(false)
    })

    it('json enabled/pass through enabled/--json flag before --/extra param/jsonEnabled() should be true', async () => {
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

    it('json enabled/pass through enabled/--json flag after --/extra param/jsonEnabled() should be false', async () => {
      class CMD extends Command {
        static enableJsonFlag = true

        async run() {
          const {flags} = await cmd.parse(CMD, ['--foo', '--', '--json'])
          expect(flags.json).to.equal(false, 'json flag should be false')
        }
      }

      const cmd = new CMD(['--foo', '--', '--json'], {} as any)
      expect(cmd.jsonEnabled()).to.equal(false)
    })

    it('json enabled/pass through enabled/--json flag before --/jsonEnabled() should be true', async () => {
      class CMD extends Command {
        static enableJsonFlag = true

        async run() {}
      }

      const cmd = new CMD(['--json', '--'], {} as any)
      expect(cmd.jsonEnabled()).to.equal(true)
    })

    it('json disabled/pass through enable/--json flag before --/jsonEnabled() should be false', async () => {
      class CMD extends Command {
        static enableJsonFlag = false

        async run() {}
      }

      const cmd = new CMD(['--json'], {} as any)
      expect(cmd.jsonEnabled()).to.equal(false)
    })
  })
})
