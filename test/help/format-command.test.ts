import {expect} from 'chai'

import {Args, Config, Flags as flags} from '../../src'
import {makeCommandClass, makeLoadable, TestHelp} from './help-test-utils'

const g: any = globalThis
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
  [APP_NAME]  app to use

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

  it('should not list hidden arguments and flags', async () => {
    const cmd = await makeLoadable(
      makeCommandClass({
        id: 'apps:create',
        description: 'creates an app',
        args: {
          // eslint-disable-next-line camelcase
          app_name: Args.string({description: 'app to use', hidden: true}),
        },
        flags: {
          app: flags.string({char: 'a', hidden: true}),
          foo: flags.string({required: true}),
        },
      }),
    )

    const output = help.formatCommand(cmd)
    expect(output).to.equal(`USAGE
  $ oclif apps:create --foo <value>

FLAGS
  --foo=<value>  (required)

DESCRIPTION
  creates an app`)
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
  [APP_NAME]
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
  [APP_NAME]
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
    it(`should output the command description with the values after a \n newline character`, async () => {
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
  [APP_NAME]  app to use

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

    it('should output flag enum with string helpValue', async () => {
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

    it('should output flag enum with array helpValue', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            myenum: flags.string({
              options: myEnumValues,
              helpValue: myEnumValues,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--myenum a b c]

FLAGS
  --myenum=a b c`)
    })

    it('should output string helpValue in usage string', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            files: flags.string({
              helpValue: '<input-json>|<input-xml>',
              multiple: true,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--files <input-json>|<input-xml>...]

FLAGS
  --files=<input-json>|<input-xml>...`)
    })

    it('should output array helpValue in usage string', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          flags: {
            files: flags.string({
              helpValue: ['<input-json>', '<input-xml>'],
              multiple: true,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [--files <input-json>... <input-xml>...]

FLAGS
  --files=<input-json>... <input-xml>...`)
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
  [ARG1]  [default: .]
  [ARG2]  [default: .] arg2 desc
  [ARG3]  arg3 desc

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
  [ARG1]  (option1|option2) Show the options`)
    })

    it('should output arg with ... if static is false', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          strict: false,
          args: {
            arg1: Args.string({description: 'Show the options'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create [ARG1...]

ARGUMENTS
  [ARG1...]  Show the options`)
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

    it('should output usage with hardcoded command', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'apps:create',
          usage: ['apps:create'],
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif apps:create`)
    })

    it('should output default usage for single letter command', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'a',
          flags: {
            'a-flag': flags.string({char: 'a', options: ['a', 'aa', 'aaa']}),
          },
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif a [-a a|aa|aaa]

FLAGS
  -a, --a-flag=<option>  <options: a|aa|aaa>`)
    })

    it('should output usage for single letter command', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'a',
          flags: {
            'a-flag': flags.string({char: 'a', options: ['a', 'aa', 'aaa']}),
          },
          usage: 'a [-a a|aa|aaa]',
        }),
      )
      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif a [-a a|aa|aaa]

FLAGS
  -a, --a-flag=<option>  <options: a|aa|aaa>`)
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

describe('formatCommand with flagSortOrder', () => {
  let config: Config

  before(async () => {
    config = await Config.load(process.cwd())
  })

  it('should not sort flags when set to "none"', async () => {
    const help = new TestHelp(config, {flagSortOrder: 'none'})
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

  it('should sort flags alphabetically when flagSortOrder is not set', async () => {
    const help = new TestHelp(config)
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
  -a, --aFlag=<value>
  -b, --bFlag=<value>
  -c, --cFlag=<value>`)
  })

  it('should sort flags alphabetically when flagSortOrder is invalid', async () => {
    // @ts-expect-error because we're testing an invalid flagSortOrder
    const help = new TestHelp(config, {flagSortOrder: 'INVALID'})
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
  -a, --aFlag=<value>
  -b, --bFlag=<value>
  -c, --cFlag=<value>`)
  })
})

describe('formatCommand with env and default values', () => {
  let config: Config
  let help: TestHelp

  before(async () => {
    config = await Config.load(process.cwd())
  })

  beforeEach(() => {
    help = new TestHelp(config)
  })

  describe('option flags', () => {
    it('should show default value for option flag with default', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({default: 'myDefault', description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  [default: myDefault] my flag`)
    })

    it('should show env variable for option flag with env', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({env: 'MY_FLAG', description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  [env: MY_FLAG] my flag`)
    })

    it('should show both default and env for option flag with both', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({default: 'myDefault', env: 'MY_FLAG', description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  [default: myDefault, env: MY_FLAG] my flag`)
    })

    it('should not show default when noCacheDefault is true and respectNoCacheDefault is true', async () => {
      const helpWithRespectNoCache = new TestHelp(config, {respectNoCacheDefault: true})
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({default: 'secret', noCacheDefault: true, description: 'my flag'}),
          },
        }),
      )

      const output = helpWithRespectNoCache.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  my flag`)
    })

    it('should show env but not default when noCacheDefault is true and respectNoCacheDefault is true', async () => {
      const helpWithRespectNoCache = new TestHelp(config, {respectNoCacheDefault: true})
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({
              default: 'secret',
              env: 'MY_FLAG',
              noCacheDefault: true,
              description: 'my flag',
            }),
          },
        }),
      )

      const output = helpWithRespectNoCache.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  [env: MY_FLAG] my flag`)
    })

    it('should show default value when noCacheDefault is true but respectNoCacheDefault is not set', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({default: 'myDefault', noCacheDefault: true, description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag <value>]

FLAGS
  --myFlag=<value>  [default: myDefault] my flag`)
    })
  })

  describe('boolean flags', () => {
    it('should show env variable for boolean flag with env', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.boolean({env: 'MY_FLAG', description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag]

FLAGS
  --myFlag  [env: MY_FLAG] my flag`)
    })

    it('should not show default for boolean flag (even if it has one)', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.boolean({default: false, description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag]

FLAGS
  --myFlag  my flag`)
    })

    it('should show env for boolean flag with env, ignoring default', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.boolean({default: false, env: 'MY_FLAG', description: 'my flag'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--myFlag]

FLAGS
  --myFlag  [env: MY_FLAG] my flag`)
    })
  })

  describe('multiple flags with mixed configurations', () => {
    it('should handle multiple flags with different configurations', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            optionWithDefault: flags.string({default: 'defaultValue', description: 'option with default'}),
            optionWithEnv: flags.string({env: 'OPTION_ENV', description: 'option with env'}),
            optionWithBoth: flags.string({
              default: 'defaultValue',
              env: 'OPTION_BOTH',
              description: 'option with both',
            }),
            booleanWithEnv: flags.boolean({env: 'BOOL_ENV', description: 'boolean with env'}),
            plainOption: flags.string({description: 'plain option'}),
            plainBoolean: flags.boolean({description: 'plain boolean'}),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd [--optionWithDefault <value>] [--optionWithEnv
    <value>] [--optionWithBoth <value>] [--booleanWithEnv] [--plainOption
    <value>] [--plainBoolean]

FLAGS
  --booleanWithEnv             [env: BOOL_ENV] boolean with env
  --optionWithBoth=<value>     [default: defaultValue, env: OPTION_BOTH] option
                               with both
  --optionWithDefault=<value>  [default: defaultValue] option with default
  --optionWithEnv=<value>      [env: OPTION_ENV] option with env
  --plainBoolean               plain boolean
  --plainOption=<value>        plain option`)
    })
  })

  describe('with required flags', () => {
    it('should show required after default and env', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:cmd',
          flags: {
            myFlag: flags.string({
              default: 'defaultValue',
              env: 'MY_FLAG',
              required: true,
              description: 'my flag',
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:cmd --myFlag <value>

FLAGS
  --myFlag=<value>  (required) [default: defaultValue, env: MY_FLAG] my flag`)
    })
  })

  describe('integer flags with min/max', () => {
    it('should display min and max values', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:minmax',
          flags: {
            port: flags.integer({
              description: 'port number',
              min: 1024,
              max: 65_535,
              default: 3000,
            }),
            retries: flags.integer({
              description: 'retry attempts',
              min: 0,
              max: 10,
              required: true,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:minmax --retries <value> [--port <value>]

FLAGS
  --port=<value>     [default: 3000, min: 1024, max: 65535] port number
  --retries=<value>  (required) [min: 0, max: 10] retry attempts`)
    })

    it('should display only min when max is not set', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:min',
          flags: {
            count: flags.integer({
              description: 'item count',
              min: 1,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:min [--count <value>]

FLAGS
  --count=<value>  [min: 1] item count`)
    })

    it('should display only max when min is not set', async () => {
      const cmd = await makeLoadable(
        makeCommandClass({
          id: 'test:max',
          flags: {
            limit: flags.integer({
              description: 'max items',
              max: 100,
            }),
          },
        }),
      )

      const output = help.formatCommand(cmd)
      expect(output).to.equal(`USAGE
  $ oclif test:max [--limit <value>]

FLAGS
  --limit=<value>  [max: 100] max items`)
    })
  })
})
