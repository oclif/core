import {test as base, expect} from '@oclif/test'

import {Args, Command as Base, Flags as flags} from '../../src'
import {TestHelp, commandHelp} from './help-test-utils'

const g: any = global
g.oclif.columns = 80

class Command extends Base {
  async run() {
    return null
  }
}

const test = base
  .loadConfig()
  .add('help', (ctx) => new TestHelp(ctx.config as any))
  .register('commandHelp', commandHelp)

describe('formatCommand', () => {
  test
    .commandHelp(
      class extends Command {
        static {
          this.id = 'apps:create'

          this.aliases = ['app:init', 'create']

          this.description = `first line

  multiline help`

          this.enableJsonFlag = true

          this.args = {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'}),
          }

          this.flags = {
            app: flags.string({char: 'a', hidden: true}),
            foo: flags.string({char: 'f', description: 'foobar'.repeat(18)}),
            force: flags.boolean({description: 'force  it '.repeat(15)}),
            ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
            remote: flags.string({char: 'r'}),
            label: flags.string({char: 'l', helpLabel: '-l'}),
          }
        }
      },
    )
    .it('handles multi-line help output', (ctx: any) =>
      expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--json] [-f <value>] [--force] [--ss]
    [-r <value>] [-l <value>]

ARGUMENTS
  APP_NAME  app to use

FLAGS
  -f, --foo=<value>     foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfo
                        obarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar
  -l=<value>
  -r, --remote=<value>
  --force               force  it force  it force  it force  it force  it force
                        it force  it force  it force  it force  it force  it
                        force  it force  it force  it force  it
  --ss                  newliney
                        newliney
                        newliney
                        newliney

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  first line

  multiline help

ALIASES
  $ oclif app:init
  $ oclif create`),
    )

  describe('arg and flag multiline handling', () => {
    test
      .commandHelp(
        class extends Command {
          static {
            this.id = 'apps:create'

            this.description = 'description of apps:create'

            this.aliases = ['app:init', 'create']

            this.enableJsonFlag = true

            this.args = {
              // eslint-disable-next-line camelcase
              app_name: Args.string({description: 'app to use'.repeat(35)}),
            }

            this.flags = {
              app: flags.string({char: 'a', hidden: true}),
              foo: flags.string({char: 'f', description: 'foobar'.repeat(15)}),
              force: flags.boolean({description: 'force  it '.repeat(15)}),
              ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
              remote: flags.string({char: 'r'}),
            }
          }
        },
      )
      .it('show args and flags side by side when their output do not exceed 4 lines ', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--json] [-f <value>] [--force] [--ss]
    [-r <value>]

ARGUMENTS
  APP_NAME
      app to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to use

FLAGS
  -f, --foo=<value>     foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfo
                        obarfoobarfoobarfoobarfoobarfoobar
  -r, --remote=<value>
  --force               force  it force  it force  it force  it force  it force
                        it force  it force  it force  it force  it force  it
                        force  it force  it force  it force  it
  --ss                  newliney
                        newliney
                        newliney
                        newliney

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  description of apps:create

ALIASES
  $ oclif app:init
  $ oclif create`),
      )

    test
      .commandHelp(
        class extends Command {
          static {
            this.id = 'apps:create'

            this.description = 'description of apps:create'

            this.aliases = ['app:init', 'create']

            this.enableJsonFlag = true

            this.args = {
              // eslint-disable-next-line camelcase
              app_name: Args.string({description: 'app to use'.repeat(35)}),
            }

            this.flags = {
              app: flags.string({char: 'a', hidden: true}),
              foo: flags.string({char: 'f', description: 'foobar'.repeat(20)}),
              force: flags.boolean({description: 'force  it '.repeat(29)}),
              ss: flags.boolean({description: 'newliney\n'.repeat(5)}),
              remote: flags.string({char: 'r'}),
            }
          }
        },
      )
      .it('shows stacked args and flags when the lines exceed 4', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--json] [-f <value>] [--force] [--ss]
    [-r <value>]

ARGUMENTS
  APP_NAME
      app to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to useapp to useapp to useapp to
      useapp to useapp to useapp to useapp to useapp to useapp to useapp to useapp
      to useapp to useapp to useapp to useapp to use

FLAGS
  -f, --foo=<value>
      foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoob
      arfoobarfoobarfoobarfoobarfoobarfoobarfoobar

  -r, --remote=<value>

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

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  description of apps:create

ALIASES
  $ oclif app:init
  $ oclif create`),
      )
  })

  describe('summary', () => {
    test
      .commandHelp(
        class extends Command {
          static id = 'test:summary'

          static summary = 'one line summary'
        },
      )
      .it('no description header if only a summary', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif test:summary`),
      )

    test
      .commandHelp(
        class extends Command {
          static description = 'description that is much longer than the summary'

          static id = 'test:summary'

          static summary = 'one line summary'
        },
      )
      .it('outputs the summary at the top of the help and description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif test:summary

DESCRIPTION
  one line summary

  description that is much longer than the summary`),
      )
  })

  describe('description', () => {
    test
      .commandHelp(
        class extends Command {
          static {
            this.id = 'apps:create'

            this.description =
              'description of apps:create\n\nthese values are after and will show up in the command description'

            this.aliases = ['app:init', 'create']

            this.enableJsonFlag = true

            this.args = {
              // eslint-disable-next-line camelcase
              app_name: Args.string({description: 'app to use'}),
            }

            this.flags = {
              force: flags.boolean({description: 'forces'}),
            }
          }
        },
      )
      .it('outputs command description with values after a \\n newline character', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--json] [--force]

ARGUMENTS
  APP_NAME  app to use

FLAGS
  --force  forces

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  description of apps:create

  these values are after and will show up in the command description

ALIASES
  $ oclif app:init
  $ oclif create`),
      )

    test
      .commandHelp(
        class extends Command {
          static description = 'root part of the description\n\nThe <%= config.bin %> CLI has <%= command.id %>'

          static id = 'apps:create'
        },
      )
      .it('renders template string from description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  root part of the description

  The oclif CLI has apps:create`),
      )

    test
      .commandHelp(
        class extends Command {
          static description = 'root part of the description\r\n\nusing both carriage \n\nreturn and new line'

          static id = 'apps:create'
        },
      )
      .it('splits on carriage return and new lines', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  root part of the description

  using both carriage

  return and new line`),
      )
  })

  const myEnumValues = ['a', 'b', 'c']
  describe('flags', () => {
    test
      .commandHelp(
        class extends Command {
          static {
            this.id = 'apps:create'

            this.flags = {
              myenum: flags.string({
                description: 'the description',
                options: myEnumValues,
              }),
            }
          }
        },
      )
      .it('outputs flag enum', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

FLAGS
  --myenum=<option>  the description
                     <options: a|b|c>`),
      )

    test
      .commandHelp(
        class extends Command {
          static flags = {
            myenum: flags.string({
              options: myEnumValues,
              helpValue: myEnumValues.join('|'),
            }),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs flag enum with helpValue', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

FLAGS
  --myenum=a|b|c`),
      )

    test
      .commandHelp(
        class extends Command {
          static args = {
            arg1: Args.string({default: '.'}),
            arg2: Args.string({default: '.', description: 'arg2 desc'}),
            arg3: Args.string({description: 'arg3 desc'}),
          }

          static flags = {
            flag1: flags.string({default: '.'}),
            flag2: flags.string({default: '.', description: 'flag2 desc'}),
            flag3: flags.string({description: 'flag3 desc'}),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs with default flag options', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [ARG1] [ARG2] [ARG3] [--flag1 <value>] [--flag2
    <value>] [--flag3 <value>]

ARGUMENTS
  ARG1  [default: .]
  ARG2  [default: .] arg2 desc
  ARG3  arg3 desc

FLAGS
  --flag1=<value>  [default: .]
  --flag2=<value>  [default: .] flag2 desc
  --flag3=<value>  flag3 desc`),
      )

    test
      .commandHelp(
        class extends Command {
          static flags = {
            opt: flags.boolean({allowNo: true}),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs with with no options', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--opt]

FLAGS
  --[no-]opt`),
      )

    test
      .commandHelp(
        class extends Command {
          static flags = {
            opt: flags.string({
              summary: 'one line summary',
              description: 'multiline\ndescription',
            }),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs flag summary and description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--opt <value>]

FLAGS
  --opt=<value>  one line summary

FLAG DESCRIPTIONS
  --opt=<value>  one line summary

    multiline
    description`),
      )

    test
      .commandHelp(
        class extends Command {
          static flags = {
            opt: flags.string({
              summary: 'one line summary',
              description: 'single line description',
            }),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs flag summary and single line description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--opt <value>]

FLAGS
  --opt=<value>  one line summary

FLAG DESCRIPTIONS
  --opt=<value>  one line summary

    single line description`),
      )

    test
      .commandHelp(
        class extends Command {
          static flags = {
            opt: flags.string({
              summary: 'one line summary'.repeat(15),
              description: 'single line description',
            }),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs long flag summary and single line description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [--opt <value>]

FLAGS
  --opt=<value>  one line summaryone line summaryone line summaryone line
                 summaryone line summaryone line summaryone line summaryone line
                 summaryone line summaryone line summaryone line summaryone line
                 summaryone line summaryone line summaryone line summary

FLAG DESCRIPTIONS
  --opt=<value>

    one line summaryone line summaryone line summaryone line summaryone line
    summaryone line summaryone line summaryone line summaryone line summaryone
    line summaryone line summaryone line summaryone line summaryone line
    summaryone line summary

    single line description`),
      )
  })

  describe('args', () => {
    test
      .commandHelp(
        class extends Command {
          static args = {
            arg1: Args.string({description: 'Show the options', options: ['option1', 'option2']}),
          }

          static id = 'apps:create'
        },
      )
      .it('outputs with arg options', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create [ARG1]

ARGUMENTS
  ARG1  (option1|option2) Show the options`),
      )
  })

  describe('usage', () => {
    test
      .commandHelp(
        class extends Command {
          static id = 'apps:create'

          static usage = '<%= config.bin %> <%= command.id %> usage'
        },
      )
      .it('outputs usage with templates', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif apps:create usage`),
      )

    test
      .commandHelp(
        class extends Command {
          static id = 'apps:create'

          static usage = ['<%= config.bin %>', '<%= command.id %> usage']
        },
      )
      .it('outputs usage arrays with templates', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif
  $ oclif apps:create usage`),
      )

    test
      .commandHelp(
        class extends Command {
          static id = 'apps:create'

          static usage = undefined
        },
      )
      .it('defaults usage when not specified', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif apps:create`),
      )
  })

  describe('examples', () => {
    test
      .commandHelp(
        class extends Command {
          static examples = ['it handles a list of examples', 'more example text']
        },
      )
      .it('outputs multiple examples', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a list of examples

  more example text`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = ['it handles a single example']
        },
      )
      .it('outputs a single example', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif

EXAMPLES
  it handles a single example`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = ['the bin is <%= config.bin %>', 'the command id is <%= command.id %>']

          static id = 'oclif:command'
        },
      )
      .it('outputs examples using templates', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  the bin is oclif

  the command id is oclif:command`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = ['<%= config.bin %> <%= command.id %> --help']

          static id = 'oclif:command'
        },
      )
      .it('formats if command', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  $ oclif oclif:command --help`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = ['Prints out help.\n<%= config.bin %> <%= command.id %> --help']

          static id = 'oclif:command'
        },
      )
      .it('formats if command with description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = [
            'Prints out help.\n<%= config.bin %> <%= command.id %> --help\n<%= config.bin %> <%= command.id %> --help',
          ]

          static id = 'oclif:command'
        },
      )
      .it('formats if multiple command with description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help
    $ oclif oclif:command --help`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = [{description: 'Prints out help.', command: '<%= config.bin %> <%= command.id %> --help'}]

          static id = 'oclif:command'
        },
      )
      .it('formats example object', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = [
            {description: 'force  it '.repeat(15), command: '<%= config.bin %> <%= command.id %> --help'},
          ]

          static id = 'oclif:command'
        },
      )
      .it('formats example object with long description', (ctx: any) =>
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  force  it force  it force  it force  it force  it force  it force  it force
  it force  it force  it force  it force  it force  it force  it force  it

    $ oclif oclif:command --help`),
      )

    test
      .commandHelp(
        class extends Command {
          static examples = [
            {
              description: 'Prints out help.',
              command: '<%= config.bin %> <%= command.id %> ' + 'force  it '.repeat(15),
            },
          ]

          static id = 'oclif:command'
        },
      )
      .it('formats example object with long command', (ctx: any) => {
        const multilineSeparator =
          ctx.config.platform === 'win32' ? (ctx.config.shell.includes('powershell') ? '`' : '^') : '\\'
        expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command force  it force  it force  it force  it force  it ${multilineSeparator}
      force  it force  it force  it force  it force  it force  it force  it ${multilineSeparator}
      force  it force  it force  it`)
      })
  })
})
