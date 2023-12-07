import {expect} from 'chai'

import {Args, Config, Flags as flags} from '../../src'
import {TestHelp, makeCommandClass, makeLoadable} from './help-test-utils'

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
        id: 'apps:create',
        aliases: ['app:init', 'create'],
        description: `first line

multiline help`,
        enableJsonFlag: true,
        args: {
          // eslint-disable-next-line camelcase
          app_name: Args.string({description: 'app to use'}),
        },
        flags: {
          app: flags.string({char: 'a', hidden: true}),
          foo: flags.string({char: 'f', description: 'foobar'.repeat(18)}),
          force: flags.boolean({description: 'force  it '.repeat(15)}),
          ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
          remote: flags.string({char: 'r'}),
          label: flags.string({char: 'l', helpLabel: '-l'}),
        },
      }),
    )

    const output = help.formatCommand(cmd)
    expect(output).to.equal(`USAGE
  $ oclif apps:create [APP_NAME] [--json] [-f <value>] [--force] [--ss]
    [-r <value>] [-l <value>]

ARGUMENTS
  APP_NAME  app to use

FLAGS
  -f, --foo=<value>     foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfo
                        obarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar
  -l=<value>
  -r, --remote=<value>
      --force           force  it force  it force  it force  it force  it force
                        it force  it force  it force  it force  it force  it
                        force  it force  it force  it force  it
      --ss              newliney
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
  $ oclif create`)
  })

  describe('arg and flag multiline handling', () => {
    it('should show args and flags side by side when their output do not exceed 4 lines ', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          aliases: ['app:init', 'create'],
          description: 'description of apps:create',
          enableJsonFlag: true,
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'.repeat(35)}),
          },
          flags: {
            app: flags.string({char: 'a', hidden: true}),
            foo: flags.string({char: 'f', description: 'foobar'.repeat(15)}),
            force: flags.boolean({description: 'force  it '.repeat(15)}),
            ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
            remote: flags.string({char: 'r'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
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
      --force           force  it force  it force  it force  it force  it force
                        it force  it force  it force  it force  it force  it
                        force  it force  it force  it force  it
      --ss              newliney
                        newliney
                        newliney
                        newliney

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  description of apps:create

ALIASES
  $ oclif app:init
  $ oclif create`)
    })

    it('should show stacked args and flags when the lines exceed 4', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          description: 'description of apps:create',
          aliases: ['app:init', 'create'],
          enableJsonFlag: true,
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'.repeat(35)}),
          },
          flags: {
            app: flags.string({char: 'a', hidden: true}),
            foo: flags.string({char: 'f', description: 'foobar'.repeat(20)}),
            force: flags.boolean({description: 'force  it '.repeat(29)}),
            ss: flags.boolean({description: 'newliney\n'.repeat(5)}),
            remote: flags.string({char: 'r'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
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
  $ oclif create`)
    })
  })

  describe('summary', () => {
    it('should not show description header if only a summary', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:summary',
          summary: 'one line summary',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:summary`)
    })

    it('should output the summary at the top of the help and description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:summary',
          summary: 'one line summary',
          description: 'description that is much longer than the summary',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:summary

DESCRIPTION
  one line summary

  description that is much longer than the summary`)
    })
  })

  describe('description', () => {
    it('should output the command description with the values after a \\n newline character', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          description:
            'description of apps:create\n\nthese values are after and will show up in the command description',
          aliases: ['app:init', 'create'],
          enableJsonFlag: true,
          args: {
            // eslint-disable-next-line camelcase
            app_name: Args.string({description: 'app to use'}),
          },
          flags: {
            force: flags.boolean({description: 'forces'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
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
  $ oclif create`)
    })

    it('should render the template string from description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          description: 'root part of the description\n\nThe <%= config.bin %> CLI has <%= command.id %>',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  root part of the description

  The oclif CLI has apps:create`)
    })

    it('should split on carriage return and new lines', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          description: 'root part of the description\r\n\nusing both carriage \n\nreturn and new line',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create

DESCRIPTION
  root part of the description

  using both carriage

  return and new line`)
    })
  })

  const myEnumValues = ['a', 'b', 'c']
  describe('flags', () => {
    it('should output flag enum', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            myenum: flags.string({
              description: 'the description',
              options: myEnumValues,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

FLAGS
  --myenum=<option>  the description
                     <options: a|b|c>`)
    })

    it('should output flag enum with helpValue', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            myenum: flags.string({
              options: myEnumValues,
              helpValue: myEnumValues.join('|'),
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--myenum a|b|c]

FLAGS
  --myenum=a|b|c`)
    })

    it('should output with default flag options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
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

FLAGS
  --flag1=<value>  [default: .]
  --flag2=<value>  [default: .] flag2 desc
  --flag3=<value>  flag3 desc`)
    })

    it('should output flags with no options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            opt: flags.boolean({allowNo: true}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--opt]

FLAGS
  --[no-]opt`)
    })

    it('should output flag summary and description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            opt: flags.string({
              summary: 'one line summary',
              description: 'multiline\ndescription',
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--opt <value>]

FLAGS
  --opt=<value>  one line summary

FLAG DESCRIPTIONS
  --opt=<value>  one line summary

    multiline
    description`)
    })

    it('should output flag summary and single line description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            opt: flags.string({
              summary: 'one line summary',
              description: 'single line description',
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--opt <value>]

FLAGS
  --opt=<value>  one line summary

FLAG DESCRIPTIONS
  --opt=<value>  one line summary

    single line description`)
    })

    it('should output long flag summary and single line description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            opt: flags.string({
              summary: 'one line summary'.repeat(15),
              description: 'single line description',
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
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

    single line description`)
    })
  })

  describe('args', () => {
    it('should output with arg options', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          args: {
            arg1: Args.string({description: 'Show the options', options: ['option1', 'option2']}),
          },
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
          usage: '<%= command.id %> usage',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create usage`)
    })

    it('should output usage arrays with templates', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          usage: ['<%= command.id %>', '<%= command.id %> usage'],
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create
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
          id: 'command',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif command

EXAMPLES
  it handles a list of examples

  more example text`)
    })

    it('should output a single example', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: ['it handles a single example'],
          id: 'command',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif command

EXAMPLES
  it handles a single example`)
    })

    it('should output examples using templates', async () => {
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

    it('should format command', async () => {
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

    it('should format command with description', async () => {
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

    it('should format command with description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: [
            'Prints out help.\n<%= config.bin %> <%= command.id %> --help\n<%= config.bin %> <%= command.id %> --help',
          ],
          id: 'oclif:command',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command --help
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

    it('should format example object with long description', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: [{description: 'force  it '.repeat(15), command: '<%= config.bin %> <%= command.id %> --help'}],
          id: 'oclif:command',
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  force  it force  it force  it force  it force  it force  it force  it force
  it force  it force  it force  it force  it force  it force  it force  it

    $ oclif oclif:command --help`)
    })

    it('should format example object with long command', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          examples: [
            {
              description: 'Prints out help.',
              command: '<%= config.bin %> <%= command.id %> ' + 'force  it '.repeat(15),
            },
          ],
          id: 'oclif:command',
        }),
      )

      const output = help.formatCommand(cmd)
      const multilineSeparator = config.platform === 'win32' ? (config.shell.includes('powershell') ? '`' : '^') : '\\'
      expect(output).to.equal(`USAGE
  $ oclif oclif:command

EXAMPLES
  Prints out help.

    $ oclif oclif:command force  it force  it force  it force  it force  it ${multilineSeparator}
      force  it force  it force  it force  it force  it force  it force  it ${multilineSeparator}
      force  it force  it force  it`)
    })
  })
})

describe('formatCommand with `none` flagSortOrder', () => {
  let config: Config
  let help: TestHelp

  before(async () => {
    config = await Config.load(process.cwd())
  })

  beforeEach(() => {
    help = new TestHelp(config, {flagSortOrder: 'none'})
  })

  it('should not sort flags', async () => {
    const cmd = await makeLoadable(
      makeCommandClass({
        id: 'apps:create',
        flags: {
          cFlag: flags.string({char: 'c'}),
          aFlag: flags.string({char: 'a'}),
          bFlag: flags.string({char: 'b'}),
        },
      }),
    )

    const output = help.formatCommand(cmd)
    expect(output).to.equal(`USAGE
  $ oclif apps:create [-c <value>] [-a <value>] [-b <value>]

FLAGS
  -c, --cFlag=<value>
  -a, --aFlag=<value>
  -b, --bFlag=<value>`)
  })
})
