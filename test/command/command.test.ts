import * as Config from '@oclif/config'
import {expect, fancy} from 'fancy-test'

import Base, {flags} from '../src'
import {TestHelpClassConfig} from './helpers/test-help-in-src/src/test-help-plugin'
import * as PluginHelp from '@oclif/plugin-help'

const originalgetHelpClass = PluginHelp.getHelpClass

// const pjson = require('../package.json')

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

  describe('convertToCached', () => {
    fancy
    // .skip()
    // .do(async () => {
    // class C extends Command {
    //   static title = 'cmd title'
    //   static type = 'mytype'
    //   static usage = ['$ usage']
    //   static description = 'test command'
    //   static aliases = ['alias1', 'alias2']
    //   static hidden = true
    //   static flags = {
    //     flaga: flags.boolean(),
    //     flagb: flags.string({
    //       char: 'b',
    //       hidden: true,
    //       required: false,
    //       description: 'flagb desc',
    //       options: ['a', 'b'],
    //       default: () => 'mydefault',
    //     }),
    //   }
    //   static args = [
    //     {
    //       name: 'arg1',
    //       description: 'arg1 desc',
    //       required: true,
    //       hidden: false,
    //       options: ['af', 'b'],
    //       default: () => 'myadefault',
    //     }
    //   ]
    // }
    // const c = Config.Command.toCached(C)
    // expect(await c.load()).to.have.property('run')
    // delete c.load
    // expect(c).to.deep.equal({
    //   _base: `@oclif/command@${pjson.version}`,
    //   id: 'foo:bar',
    //   type: 'mytype',
    //   hidden: true,
    //   pluginName: undefined,
    //   description: 'test command',
    //   aliases: ['alias1', 'alias2'],
    //   title: 'cmd title',
    //   usage: ['$ usage'],
    //   flags: {
    //     flaga: {
    //       char: undefined,
    //       description: undefined,
    //       name: 'flaga',
    //       hidden: undefined,
    //       required: undefined,
    //       type: 'boolean',
    //     },
    //     flagb: {
    //       char: 'b',
    //       description: 'flagb desc',
    //       name: 'flagb',
    //       hidden: true,
    //       required: false,
    //       type: 'option',
    //       helpValue: undefined,
    //       default: 'mydefault',
    //       options: ['a', 'b'],
    //     }
    //   },
    //   args: [
    //     {
    //       description: 'arg1 desc',
    //       name: 'arg1',
    //       hidden: false,
    //       required: true,
    //       options: ['af', 'b'],
    //       default: 'myadefault',
    //     }
    //   ],
    // })
    // })
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
            foo: flags.string(),
          }

          async run() {
            const {flags} = this.parse(CMD)
            this.log(flags.foo)
          }
      }

      await CMD.run(['--foo=bar'])
      expect(ctx.stdout).to.equal('bar\n')
    })
  })

  describe('version', () => {
    fancy
    .stdout()
    .add('config', () => Config.load())
    .do(async () => {
      await Command.run(['--version'])
    })
    .catch(/EEXIT: 0/)
    .it('shows version', ctx => {
      expect(ctx.stdout).to.equal(`${ctx.config.userAgent}\n`)
    })
  })

  describe('help', () => {
    fancy
    .stdout()
    .do(() => {
      class CMD extends Command {
          static flags = {help: flags.help()}
      }
      return CMD.run(['--help'])
    })
    .catch(/EEXIT: 0/)
    .it('--help', ctx => {
      expect(ctx.stdout).to.equal(`test command

USAGE
  $ @oclif/command

OPTIONS
  --help  show CLI help

`)
    })

    fancy
    .stdout()
    .do(async () => {
      class CMD extends Command {}
      await CMD.run(['-h'])
    })
    .catch(/EEXIT: 0/)
    .it('-h', ctx => {
      // expect(process.exitCode).to.equal(0)
      expect(ctx.stdout).to.equal(`test command

USAGE
  $ @oclif/command

`)
    })

    fancy
    .stdout()
    .add('config', async () => {
      const config: TestHelpClassConfig = await Config.load()
      config.pjson.oclif.helpClass = 'help-class-does-not-exist'
      return config
    })
    .do(async ({config}) => {
      class CMD extends Command {
        config = config
      }
      await CMD.run(['-h'])
    })
    .catch((error: Error) => expect(error.message).to.contain('Unable to load configured help class "help-class-does-not-exist", failed with message:\n'))
    .it('shows useful error message when configured help class cannot be loaded')

    fancy
    .stdout()
    .stub(PluginHelp, 'getHelpClass', function (config: any) {
      return originalgetHelpClass(config, '')
    })
    .add('config', async () => {
      const config: TestHelpClassConfig = await Config.load()
      config.pjson.oclif.helpClass = undefined
      return config
    })
    .do(async ({config}) => {
      class CMD extends Command {
        config = config
      }
      await CMD.run(['-h'])
    })
    .catch((error: Error) => expect(error.message).to.contain('Could not load a help class, consider installing the @oclif/plugin-help package, failed with message:\n'))
    .it('shows useful error message when no help class has been configured and the default cannot be loaded')

    describe('from a help class', () => {
      fancy
      .stdout()
      .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
        const patchedConfig = {
          ...config,
          root: `${__dirname}/helpers/test-help-in-lib/`,
        }

        return originalgetHelpClass(patchedConfig)
      })
      .add('config', async () => {
        const config: TestHelpClassConfig = await Config.load()
        config.pjson.oclif.helpClass = './lib/test-help-plugin'
        return config
      })
      .do(async ({config}) => {
        class CMD extends Command {
          static id = 'test-command-for-help-plugin'

          config = config
        }
        await CMD.run(['-h'])
      })
      .catch(/EEXIT: 0/)
      .it('-h via a plugin in lib dir (compiled to js)', ctx => {
        expect(ctx.stdout).to.equal('hello from test-help-plugin #showCommandHelp in the lib folder and in compiled javascript\n')
        expect(ctx.config.showCommandHelpSpy!.getCalls().length).to.equal(1)
        expect(ctx.config.showHelpSpy!.getCalls().length).to.equal(0)
        const [Command, Topics] = ctx.config.showCommandHelpSpy!.firstCall.args
        expect(Command.id).to.deep.equal('test-command-for-help-plugin')
        expect(Topics).to.be.an('array')
      })

      fancy
      .stdout()
      .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
        const patchedConfig = {
          ...config,
          root: `${__dirname}/helpers/test-help-in-src/`,
        }

        return originalgetHelpClass(patchedConfig)
      })
      .add('config', async () => {
        const config: TestHelpClassConfig = await Config.load()
        config.pjson.oclif.helpClass = './lib/test-help-plugin'
        return config
      })
      .do(async ({config}) => {
        class CMD extends Command {
          static id = 'test-command-for-help-plugin'

          config = config
        }
        await CMD.run(['-h'])
      })
      .catch(/EEXIT: 0/)
      .it('-h via a plugin in src dir (source in ts)', ctx => {
        expect(ctx.stdout).to.equal('hello from test-help-plugin #showCommandHelp\n')
        expect(ctx.config.showCommandHelpSpy!.getCalls().length).to.equal(1)
        expect(ctx.config.showHelpSpy!.getCalls().length).to.equal(0)
        const [Command, Topics] = ctx.config.showCommandHelpSpy!.firstCall.args
        expect(Command.id).to.deep.equal('test-command-for-help-plugin')
        expect(Topics).to.be.an('array')
      })

      fancy
      .stdout()
      .stub(PluginHelp, 'getHelpClass', function (config: Config.IConfig) {
        const patchedConfig = {
          ...config,
          root: `${__dirname}/helpers/test-help-in-src/`,
        }

        return originalgetHelpClass(patchedConfig)
      })
      .add('config', async () => {
        const config: TestHelpClassConfig = await Config.load()
        config.pjson.oclif.helpClass = './lib/test-help-plugin'
        return config
      })
      .do(async ({config}) => {
        class CMD extends Command {
          static id = 'test-command-for-help-plugin'

          config = config

          static flags = {help: flags.help()}
        }
        return CMD.run(['--help'])
      })
      .catch(/EEXIT: 0/)
      .it('--help via a plugin in src dir (source in ts)', ctx => {
        expect(ctx.stdout).to.equal('hello from test-help-plugin #showCommandHelp\n')
        expect(ctx.config.showCommandHelpSpy!.getCalls().length).to.equal(1)
        expect(ctx.config.showHelpSpy!.getCalls().length).to.equal(0)
        const [Command, Topics] = ctx.config.showCommandHelpSpy!.firstCall.args
        expect(Command.id).to.deep.equal('test-command-for-help-plugin')
        expect(Topics).to.be.an('array')
      })
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
