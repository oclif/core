import {expect} from 'chai'

import {Config, Interfaces} from '../../src'
import {Command} from '../../src/command'
import {CommandHelp, Help} from '../../src/help'
import {AppsAdminAdd, AppsAdminTopic, AppsCreate, AppsDestroy, AppsIndexWithDesc, AppsTopic} from './fixtures/fixtures'
import {monkeyPatchCommands} from './help-test-utils'

// Allow overriding section headers
class TestCommandHelp extends CommandHelp {
  protected sections() {
    const sectionsToRemove = new Set(['DESCRIPTION'])
    let sections = super.sections()

    sections = sections.filter((section) => !sectionsToRemove.has(section.header))

    sections.push({
      header: 'CUSTOM',
      generate: () => `my custom section

${this.indent(this.wrap('force  it '.repeat(29)))}`,
    })
    return sections
  }
}

class TestHelp extends Help {
  CommandHelpClass = TestCommandHelp

  public declare config: Config
  public output: string[] = []
  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    opts.stripAnsi = true
    super(config, opts)
    this.opts.usageHeader = 'SYNOPSIS'
  }

  public getOutput() {
    return this.output.join('\n').trimEnd()
  }

  // push logs to this.output instead of logging to the console
  // this makes it easier to test the output
  protected log(...args: any[]) {
    this.output.push(...args)
  }

  public async showRootHelp() {
    return super.showRootHelp()
  }

  public async showTopicHelp(topic: Interfaces.Topic) {
    return super.showTopicHelp(topic)
  }

  summary(c: Command.Loadable): string {
    // This will essentially ignore the summary
    return this.wrap(c.description || '')
  }
}

describe('showHelp for root', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  it('shows a command and topic when the index has siblings', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsIndexWithDesc, AppsCreate, AppsDestroy],
        topics: [],
      },
    ])
    const help = new TestHelp(config)
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

SYNOPSIS
  $ oclif [COMMAND]

TOPICS
  apps  List all apps (app index command)

COMMANDS
  apps  List all apps (app index command)
        this only shows up in command help under DESCRIPTION`)
  })

  it('shows a command only when the topic only contains an index', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsIndexWithDesc],
        topics: [],
      },
    ])
    const help = new TestHelp(config)
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

SYNOPSIS
  $ oclif [COMMAND]

COMMANDS
  apps  List all apps (app index command)
        this only shows up in command help under DESCRIPTION`)
  })
})

describe('showHelp for a command', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  it('shows help for a leaf (or childless) command', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsCreate],
        topics: [AppsTopic],
      },
    ])

    const help = new TestHelp(config)
    await help.showHelp(['apps:create'])
    const output = help.getOutput()
    expect(output).to.equal(`this only shows up in command help under DESCRIPTION

SYNOPSIS
  $ oclif apps:create

CUSTOM
  my custom section

    force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it`)
  })

  it('shows help for a command that has children topics and commands', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsIndexWithDesc, AppsCreate, AppsAdminAdd],
        topics: [AppsTopic, AppsAdminTopic],
      },
    ])

    const help = new TestHelp(config)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`List all apps (app index command)
this only shows up in command help under DESCRIPTION

SYNOPSIS
  $ oclif apps

CUSTOM
  my custom section

    force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create  this only shows up in command help under DESCRIPTION`)
  })
})
