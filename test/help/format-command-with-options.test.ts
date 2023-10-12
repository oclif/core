import {expect} from 'chai'

import {Args, Config, Flags as flags} from '../../src'
import {TestHelpWithOptions as TestHelp, makeCommandClass, makeLoadable} from './help-test-utils'

const g: any = global
g.oclif.columns = 80

describe('formatCommand', () => {
  let config: Config
  let help: TestHelp

  before(async () => {
    config = await Config.load(process.cwd())
  })

  beforeEach(() => {
    help = new TestHelp(config)
  })

  it('should handle multi-line help output', async () => {
    const cmd = await makeLoadable(
      makeCommandClass({
        aliases: ['app:init', 'create'],
        args: {
          // eslint-disable-next-line camelcase
          app_name: Args.string({description: 'app to use'}),
        },
        deprecateAliases: true,
        description: `first line
multiline help`,
        flags: {
          app: flags.string({char: 'a', hidden: true}),
          foo: flags.string({char: 'f', description: 'foobar'.repeat(18)}),
          force: flags.boolean({description: 'force  it '.repeat(15)}),
          ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
          remote: flags.string({char: 'r'}),
          label: flags.string({char: 'l', helpLabel: '-l'}),
        },
        id: 'apps:create',
      }),
    )
    const output = help.formatCommand(cmd)
    expect(output).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [-f <value>] [--force] [--ss] [-r
    <value>] [-l <value>]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  -f, --foo=foo        foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoo
                       barfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar
  -l=label
  -r, --remote=remote
  --force              force  it force  it force  it force  it force  it force
                       it force  it force  it force  it force  it force  it
                       force  it force  it force  it force  it
  --ss                 newliney
                       newliney
                       newliney
                       newliney

DESCRIPTION
  multiline help

ALIASES
  $ oclif app:init
  $ oclif create`)
  })

  describe('arg and flag multiline handling', () => {
    it('should show args and flags side by side when their output do not exceed 4 lines ', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          aliases: ['app:init', 'create'],
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'.repeat(35)}),
          },
          description: 'description of apps:create',
          flags: {
            app: flags.string({char: 'a', hidden: true}),
            foo: flags.string({char: 'f', description: 'foobar'.repeat(15)}),
            force: flags.boolean({description: 'force  it '.repeat(15)}),
            ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
            remote: flags.string({char: 'r'}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [-f <value>] [--force] [--ss] [-r
    <value>]

ARGUMENTS
  APP_NAME
      app to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to use

OPTIONS
  -f, --foo=foo        foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoo
                       barfoobarfoobarfoobarfoobarfoobar
  -r, --remote=remote
  --force              force  it force  it force  it force  it force  it force
                       it force  it force  it force  it force  it force  it
                       force  it force  it force  it force  it
  --ss                 newliney
                       newliney
                       newliney
                       newliney

ALIASES
  $ oclif app:init
  $ oclif create`)
    })

    it('should show stacked args and flags when the lines exceed 4', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          aliases: ['app:init', 'create'],
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'.repeat(35)}),
          },
          description: 'description of apps:create',
          flags: {
            app: flags.string({char: 'a', hidden: true}),
            foo: flags.string({char: 'f', description: 'foobar'.repeat(20)}),
            force: flags.boolean({description: 'force  it '.repeat(29)}),
            ss: flags.boolean({description: 'newliney\n'.repeat(5)}),
            remote: flags.string({char: 'r'}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [-f <value>] [--force] [--ss] [-r
    <value>]

ARGUMENTS
  APP_NAME
      app to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to use

OPTIONS
  -f, --foo=foo
      foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoob
      arfoobarfoobarfoobarfoobarfoobarfoobarfoobar

  -r, --remote=remote

  --force
      force  it force  it force  it force  it force  it force  it force  it force
      it force  it force  it force  it force  it force  it force  it force  it
      force  it force  it force  it force  it force  it force  it force  it force
      it force  it force  it force  it force  it force  it force  it

  --ss
      newliney
      newliney
      newliney
      newliney
      newliney

ALIASES
  $ oclif app:init
  $ oclif create`)
    })
  })

  describe('description', () => {
    it('should output command description with values after a \\n newline character', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          aliases: ['app:init', 'create'],
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'}),
          },
          description: 'description of apps:create\nthese values are after and will show up in the command description',
          flags: {
            force: flags.boolean({description: 'forces'}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--force]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  --force  forces

DESCRIPTION
  these values are after and will show up in the command description

ALIASES
  $ oclif app:init
  $ oclif create`)
    })

    it('should render template string from description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          description: 'root part of the description\nThe <%= config.bin %> CLI has <%= command.id %>',
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  The oclif CLI has apps:create`)
    })
  })

  describe('flags', () => {
    it('should output flag options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          flags: {
            myenum: flags.string({
              options: ['a', 'b', 'c'],
            }),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

OPTIONS
  --myenum=a|b|c`)
    })

    it('should output default flag options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          args: {
            arg1: Args.string({default: '.'}),
            arg2: Args.string({default: '.', description: 'arg2 desc'}),
            arg3: Args.string({description: 'arg3 desc'}),
          },
          flags: {
            flag1: flags.string({default: '.'}),
            flag2: flags.string({default: '.', description: 'flag2 desc'}),
            flag3: flags.string({description: 'flag3 desc'}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [ARG1] [ARG2] [ARG3] [--flag1 <value>] [--flag2
    <value>] [--flag3 <value>]

ARGUMENTS
  ARG1  [default: .]
  ARG2  [default: .] arg2 desc
  ARG3  arg3 desc

OPTIONS
  --flag1=flag1  [default: .]
  --flag2=flag2  [default: .] flag2 desc
  --flag3=flag3  flag3 desc`)
    })

    it('should output with no options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          flags: {
            opt: flags.boolean({allowNo: true}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--opt]

OPTIONS
  --[no-]opt`)
    })
  })

  describe('args', () => {
    it('should output arg options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          args: {
            arg1: Args.string({description: 'Show the options', options: ['option1', 'option2']}),
          },
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [ARG1]

ARGUMENTS
  ARG1  (option1|option2) Show the options`)
    })
  })

  describe('usage', () => {
    it('should output usage with templates', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          usage: '<%= config.bin %> <%= command.id %> usage',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif apps:create usage`)
    })

    it('should output usage arrays with templates', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          usage: ['<%= config.bin %>', '<%= command.id %> usage'],
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif
  $ oclif apps:create usage`)
    })

    it('should output default usage when not specified', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create`)
    })
  })

  describe('examples', () => {
    it('should output multiple examples', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['it handles a list of examples', 'more example text'],
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a list of examples

  more example text`)
    })

    it('should output a single example', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['it handles a single example'],
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a single example`)
    })

    it('should output example using templates', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['the bin is <%= config.bin %>', 'the command id is <%= command.id %>'],
          id: 'oclif:command',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  the bin is oclif

  the command id is oclif:command`)
    })

    it('should format if command', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['<%= config.bin %> <%= command.id %> --help'],
          id: 'oclif:command',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  $ oclif oclif:command --help`)
    })

    it('should format if command with description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['Prints out help.\n<%= config.bin %> <%= command.id %> --help'],
          id: 'oclif:command',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`)
    })

    it('should format example object', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: [{description: 'Prints out help.', command: '<%= config.bin %> <%= command.id %> --help'}],
          id: 'oclif:command',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`)
    })
  })
})
