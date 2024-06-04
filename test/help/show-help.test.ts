import {expect} from 'chai'
import sinon from 'sinon'

import {Config, Interfaces} from '../../src'
import {Help} from '../../src/help'
import {
  AppsAdminAdd,
  AppsAdminIndex,
  AppsAdminTopic,
  AppsCreate,
  AppsDestroy,
  AppsIndex,
  AppsTopic,
  CommandWithAliases,
  DbCreate,
  DbTopic,
  DeprecateAliases,
} from './fixtures/fixtures'
import {monkeyPatchCommands} from './help-test-utils'

// extension makes previously protected methods public
class TestHelp extends Help {
  public declare config: Config
  public output: string[] = []

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    opts.stripAnsi = true
    super(config, opts)
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
}

describe('showHelp for root', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  it('shows a command and topic when the index has siblings', async () => {
    monkeyPatchCommands(
      config,
      [
        {
          name: 'plugin-1',
          commands: [AppsIndex, AppsCreate, AppsDestroy],
          topics: [],
        },
      ],
      false,
    )
    const help = new TestHelp(config)
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

USAGE
  $ oclif [COMMAND]

TOPICS
  apps     List all apps (app index command)
  plugins  List installed plugins.

COMMANDS
  apps     List all apps (app index command)
  help     Display help for oclif.
  plugins  List installed plugins.`)
  })

  it('shows a command only when the topic only contains an index', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsIndex],
        topics: [],
      },
    ])
    const help = new TestHelp(config)
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

USAGE
  $ oclif [COMMAND]

COMMANDS
  apps  List all apps (app index command)`)
  })

  it('shows root help without aliases if hideAliasesFromRoot=true', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [CommandWithAliases],
        topics: [],
      },
    ])

    const help = new TestHelp(config as any, {hideAliasesFromRoot: true})
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

USAGE
  $ oclif [COMMAND]

COMMANDS
  foo  This is a command with aliases`)
  })

  it('shows root help with aliases commands by default', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [CommandWithAliases],
        topics: [],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp([])
    const output = help.getOutput()
    expect(output).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

USAGE
  $ oclif [COMMAND]

COMMANDS
  bar  This is a command with aliases
  baz  This is a command with aliases
  foo  This is a command with aliases
  qux  This is a command with aliases`)
  })
})

describe('showHelp for a topic', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  it('shows topic help with commands', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsCreate, AppsDestroy],
        topics: [AppsTopic],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  it('shows topic help with topic and commands', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsCreate, AppsDestroy, AppsAdminAdd],
        topics: [AppsTopic, AppsAdminTopic],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  it('shows topic help with topic and commands and topic command', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsCreate, AppsDestroy, AppsAdminIndex, AppsAdminAdd],
        topics: [AppsTopic, AppsAdminTopic],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:admin    List of admins for an app
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  it('ignores other topics and commands', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsCreate, AppsDestroy, AppsAdminAdd, DbCreate],
        topics: [AppsTopic, AppsAdminTopic, DbTopic],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  it('show deprecation warning when using alias', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [DeprecateAliases],
        topics: [],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['foo:bar:alias'])
    const output = help.getOutput()
    expect(output).to.equal(`The "foo:bar:alias" command has been deprecated. Use "foo:bar" instead.

USAGE
  $ oclif foo:bar:alias

ALIASES
  $ oclif foo:bar:alias`)
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
    expect(output).to.equal(`Create an app

USAGE
  $ oclif apps:create

DESCRIPTION
  Create an app

  this only shows up in command help under DESCRIPTION`)
  })

  it('shows help for a command that has children topics and commands', async () => {
    monkeyPatchCommands(config, [
      {
        name: 'plugin-1',
        commands: [AppsIndex, AppsCreate, AppsAdminAdd],
        topics: [AppsTopic, AppsAdminTopic],
      },
    ])

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
    const output = help.getOutput()
    expect(output).to.equal(`List all apps (app index command)

USAGE
  $ oclif apps

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create  Create an app`)
  })
})

describe('showHelp routing', () => {
  let config: Config
  let help: TestHelp
  const stubs = {
    showRootHelp: sinon.stub(),
    showTopicHelp: sinon.stub(),
    showCommandHelp: sinon.stub(),
  }

  beforeEach(async () => {
    config = await Config.load()
    stubs.showCommandHelp = sinon.stub(TestHelp.prototype, 'showCommandHelp').resolves()
    stubs.showRootHelp = sinon.stub(TestHelp.prototype, 'showRootHelp').resolves()
    stubs.showTopicHelp = sinon.stub(TestHelp.prototype, 'showTopicHelp').resolves()
    help = new TestHelp(config)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('shows root help', () => {
    it('shows root help when no subject is provided', async () => {
      await help.showHelp([])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    it('shows root help when help is the only arg', async () => {
      await help.showHelp(['help'])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('shows topic help', () => {
    beforeEach(() => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      sinon.stub(config, 'findCommand').returns(undefined)
    })

    it('shows the topic help when a topic has no matching command', async () => {
      await help.showHelp(['plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })

    it('shows the topic help when a topic has no matching command and is preceded by help', async () => {
      await help.showHelp(['help', 'plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })
  })

  describe('shows command help', () => {
    it('calls showCommandHelp when a topic that is also a command is called', async () => {
      await help.showHelp(['plugins'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    it('calls showCommandHelp when a command is called', async () => {
      await help.showHelp(['plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    it('calls showCommandHelp when a command is preceded by the help arg', async () => {
      await help.showHelp(['help', 'plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('errors', () => {
    it('shows an error when there is a subject but it does not match a topic or command', async () => {
      await expect(help.showHelp(['meow'])).to.be.rejectedWith('Command meow not found')
    })
  })
})
