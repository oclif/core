import {expect, fancy} from 'fancy-test'
import {EOL} from 'os'
// import path = require('path')

import {Command as Base, Flags as flags} from '../../src'
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
  .do(output => expect(output.stdout).to.equal(`foo${EOL}`))
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
          const {flags} = await this.parse(CMD)
          this.log(flags.foo)
        }
      }

      await CMD.run(['--foo=bar'])
      expect(ctx.stdout).to.equal(`bar${EOL}`)
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
    .do(ctx => expect(ctx.stdout).to.equal(`json output: {"a":"foobar"}${EOL}`))
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
    .do(ctx => expect(ctx.stdout).to.equal(`json output: {"a":"foobar"}${EOL}`))
    .it('test stdout EPIPE swallowed')
  })
})
