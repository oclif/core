import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

import {Command as Base, Flags as flags, Interfaces, toCached} from '../../src'
import {Help, CommandHelp} from '../../src/help'

const g: any = global
g.oclif.columns = 80

class Command extends Base {
  static disableJsonFlag = true

  async run() {
    return null
  }
}

// Allow overriding section headers
class TestCommandHelp extends CommandHelp {
  protected sections() {
    const sections = super.sections()
    const flagSection = sections.find(section => section.header === 'FLAGS')
    if (flagSection) flagSection.header = 'OPTIONS'
    return sections
  }
}

// extensions to expose method as public for testing
class TestHelp extends Help {
  CommandHelpClass = TestCommandHelp

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
    this.opts.showFlagNameInTitle = true
    this.opts.showFlagOptionsInTitle = true
    this.opts.hideCommandSummaryInDescription = true
  }

  public formatCommand(command: Interfaces.Command) {
    return super.formatCommand(command)
  }
}

const test = base
.loadConfig()
.add('help', ctx => new TestHelp(ctx.config as any))
.register('commandHelp', (command?: any) => ({
  async run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const cached = await toCached(command!, {} as any)
    const help = ctx.help.formatCommand(cached)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }
    ctx.commandHelp = stripAnsi(help).split('\n').map(s => s.trimRight()).join('\n')
    ctx.expectation = 'has commandHelp'
  },
}))

describe('formatCommand', () => {
  test
  .commandHelp(class extends Command {
      static id = 'apps:create'

      static aliases = ['app:init', 'create']

      static description = `first line
multiline help`

      static args = [{name: 'app_name', description: 'app to use'}]

      static flags = {
        app: flags.string({char: 'a', hidden: true}),
        foo: flags.string({char: 'f', description: 'foobar'.repeat(18)}),
        force: flags.boolean({description: 'force  it '.repeat(15)}),
        ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
        remote: flags.string({char: 'r'}),
        label: flags.string({char: 'l', helpLabel: '-l'}),
      }
  })
  .it('handles multi-line help output', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
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
  $ oclif create`))

  describe('arg and flag multiline handling', () => {
    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static description = 'description of apps:create'

        static aliases = ['app:init', 'create']

        static args = [{name: 'app_name', description: 'app to use'.repeat(35)}]

        static flags = {
          app: flags.string({char: 'a', hidden: true}),
          foo: flags.string({char: 'f', description: 'foobar'.repeat(15)}),
          force: flags.boolean({description: 'force  it '.repeat(15)}),
          ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
          remote: flags.string({char: 'r'}),
        }
    })
    .it('show args and flags side by side when their output do not exceed 4 lines ', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
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
  $ oclif create`))

    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static description = 'description of apps:create'

        static aliases = ['app:init', 'create']

        static args = [{name: 'app_name', description: 'app to use'.repeat(35)}]

        static flags = {
          app: flags.string({char: 'a', hidden: true}),
          foo: flags.string({char: 'f', description: 'foobar'.repeat(20)}),
          force: flags.boolean({description: 'force  it '.repeat(29)}),
          ss: flags.boolean({description: 'newliney\n'.repeat(5)}),
          remote: flags.string({char: 'r'}),
        }
    })
    .it('shows stacked args and flags when the lines exceed 4', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
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
  $ oclif create`))
  })

  describe('description', () => {
    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static description = 'description of apps:create\nthese values are after and will show up in the command description'

        static aliases = ['app:init', 'create']

        static args = [{name: 'app_name', description: 'app to use'}]

        static flags = {
          force: flags.boolean({description: 'forces'}),
        }
    })
    .it('outputs command description with values after a \\n newline character', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--force]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  --force  forces

DESCRIPTION
  these values are after and will show up in the command description

ALIASES
  $ oclif app:init
  $ oclif create`))

    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static description = 'root part of the description\nThe <%= config.bin %> CLI has <%= command.id %>'
    })
    .it('renders template string from description', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  The oclif CLI has apps:create`))
  })

  describe(('flags'), () => {
    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static flags = {
          myenum: flags.string({
            options: ['a', 'b', 'c'],
          }),
        }
    })
    .it('outputs flag enum', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

OPTIONS
  --myenum=a|b|c`))

    test
    .commandHelp(class extends Command {
      static id = 'apps:create'

      static args = [
        {name: 'arg1', default: '.'},
        {name: 'arg2', default: '.', description: 'arg2 desc'},
        {name: 'arg3', description: 'arg3 desc'},
      ]

      static flags = {
        flag1: flags.string({default: '.'}),
        flag2: flags.string({default: '.', description: 'flag2 desc'}),
        flag3: flags.string({description: 'flag3 desc'}),
      }
    }).it('outputs with default flag options', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [ARG1] [ARG2] [ARG3] [--flag1 <value>] [--flag2
    <value>] [--flag3 <value>]

ARGUMENTS
  ARG1  [default: .]
  ARG2  [default: .] arg2 desc
  ARG3  arg3 desc

OPTIONS
  --flag1=flag1  [default: .]
  --flag2=flag2  [default: .] flag2 desc
  --flag3=flag3  flag3 desc`))

    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static flags = {
          opt: flags.boolean({allowNo: true}),
        }
    })
    .it('outputs with with no options', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--opt]

OPTIONS
  --[no-]opt`))
  })

  describe('args', () =>  {
    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static args = [
          {name: 'arg1', description: 'Show the options', options: ['option1', 'option2']},
        ]
    })
    .it('outputs with arg options', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [ARG1]

ARGUMENTS
  ARG1  (option1|option2) Show the options`))
  })

  describe('usage', () => {
    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static usage = '<%= config.bin %> <%= command.id %> usage'
    })
    .it('outputs usage with templates', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif apps:create usage`))

    test
    .commandHelp(class extends Command {
        static id = 'apps:create'

        static usage = ['<%= config.bin %>', '<%= command.id %> usage']
    })
    .it('outputs usage arrays with templates', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif
  $ oclif apps:create usage`))

    test
    .commandHelp(class extends Command {
      static id = 'apps:create'

      static usage = undefined
    })
    .it('defaults usage when not specified', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create`))
  })

  describe('examples', () => {
    test
    .commandHelp(class extends Command {
        static examples = ['it handles a list of examples', 'more example text']
    })
    .it('outputs multiple examples', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a list of examples

  more example text`))

    test
    .commandHelp(class extends Command {
        static examples = ['it handles a single example']
    })
    .it('outputs a single example', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a single example`))

    test
    .commandHelp(class extends Command {
        static id = 'oclif:command'

        static examples = ['the bin is <%= config.bin %>', 'the command id is <%= command.id %>']
    })
    .it('outputs examples using templates', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  the bin is oclif

  the command id is oclif:command`))

    test
    .commandHelp(class extends Command {
        static id = 'oclif:command'

        static examples = ['<%= config.bin %> <%= command.id %> --help']
    })
    .it('formats if command', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  $ oclif oclif:command --help`))

    test
    .commandHelp(class extends Command {
        static id = 'oclif:command'

        static examples = ['Prints out help.\n<%= config.bin %> <%= command.id %> --help']
    })
    .it('formats if command with description', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`))

    test
    .commandHelp(class extends Command {
        static id = 'oclif:command'

        static examples = [{description: 'Prints out help.', command: '<%= config.bin %> <%= command.id %> --help'}]
    })
    .it('formats example object', (ctx: any) => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`))
  })
})
