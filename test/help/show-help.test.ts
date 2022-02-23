import {expect, test as base} from '@oclif/test'
import {stub, SinonStub} from 'sinon'
import * as path from 'path'

import {Help} from '../../src/help'
import {AppsIndex, AppsDestroy, AppsCreate, AppsTopic, AppsAdminTopic, AppsAdminAdd, AppsAdminIndex, DbCreate, DbTopic} from './fixtures/fixtures'
import {Interfaces, Config} from '../../src'

const g: any = global
g.oclif.columns = 80

// extension makes previously protected methods public
class TestHelp extends Help {
  public config: any;

  public async showRootHelp() {
    return super.showRootHelp()
  }

  public async showTopicHelp(topic: Interfaces.Topic) {
    return super.showTopicHelp(topic)
  }
}

const test = base
.register('setupHelp', () => ({
  async run(ctx: { help: TestHelp; stubs: { [k: string]: SinonStub }}) {
    ctx.stubs = {
      showRootHelp: stub(TestHelp.prototype, 'showRootHelp').resolves(),
      showTopicHelp: stub(TestHelp.prototype, 'showTopicHelp').resolves(),
      showCommandHelp: stub(TestHelp.prototype, 'showCommandHelp').resolves(),
    }

    // use devPlugins: true to bring in plugins-plugin with topic commands for testing
    const config = await Config.load({devPlugins: true, root: path.resolve(__dirname, '..')})
    ctx.help = new TestHelp(config)
  },
  finally(ctx) {
    for (const stub of Object.values(ctx.stubs))  stub.restore()
  },
}))
.register('makeTopicsWithoutCommand', () => ({
  async run(ctx: {help: TestHelp; makeTopicOnlyStub: SinonStub}) {
    // by returning no matching command for a subject, it becomes a topic only
    // with no corresponding command (in which case the showCommandHelp is shown)
    // eslint-disable-next-line unicorn/no-useless-undefined
    ctx.makeTopicOnlyStub = stub(ctx.help.config, 'findCommand').returns(undefined)
  },
  finally(ctx) {
    ctx.makeTopicOnlyStub.restore()
  },
}))

describe('showHelp for root', () => {
  test
  .loadConfig()
  .stdout()
  .do(async () => {
    const config = await Config.load({root: path.resolve(__dirname, '..')});

    (config as any).plugins = [{
      commands: [AppsIndex, AppsCreate, AppsDestroy],
      topics: [],
    }]
    for (const plugin of config.plugins) {
      // @ts-expect-error private method
      config.loadCommands(plugin)
      // @ts-expect-error private method
      config.loadTopics(plugin)
    }

    const help = new TestHelp(config as any)
    await help.showHelp([])
  })
  .it('shows a command and topic when the index has siblings', ({stdout, config}) => {
    expect(stdout.trim()).to.equal(`base library for oclif CLIs

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

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsIndex],
      topics: [],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp([])
  })
  .it('shows a command only when the topic only contains an index', ({stdout, config}) => {
    expect(stdout.trim()).to.equal(`base library for oclif CLIs

VERSION
  ${config.userAgent}

USAGE
  $ oclif [COMMAND]

COMMANDS
  apps  List all apps (app index command)`)
  })
})

describe('showHelp for a topic', () => {
  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsCreate, AppsDestroy],
      topics: [AppsTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('shows topic help with commands', ({stdout}) => {
    expect(stdout.trim()).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsCreate, AppsDestroy, AppsAdminAdd],
      topics: [AppsTopic, AppsAdminTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('shows topic help with topic and commands', ({stdout}) => {
    expect(stdout.trim()).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsCreate, AppsDestroy, AppsAdminIndex, AppsAdminAdd],
      topics: [AppsTopic, AppsAdminTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('shows topic help with topic and commands and topic command', ({stdout}) => {
    expect(stdout.trim()).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:admin    List of admins for an app
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsCreate, AppsDestroy, AppsAdminAdd, DbCreate],
      topics: [AppsTopic, AppsAdminTopic, DbTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('ignores other topics and commands', ({stdout}) => {
    expect(stdout.trim()).to.equal(`This topic is for the apps topic

USAGE
  $ oclif apps:COMMAND

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create   Create an app
  apps:destroy  Destroy an app`)
  })
})

describe('showHelp for a command', () => {
  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsCreate],
      topics: [AppsTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps:create'])
  })
  .it('shows help for a leaf (or childless) command', ({stdout}) => {
    expect(stdout.trim()).to.equal(`Create an app

USAGE
  $ oclif apps:create

DESCRIPTION
  Create an app

  this only shows up in command help under DESCRIPTION`)
  })

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsIndex, AppsCreate, AppsAdminAdd],
      topics: [AppsTopic, AppsAdminTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('shows help for a command that has children topics and commands', ({stdout}) => {
    expect(stdout.trim()).to.equal(`List all apps (app index command)

USAGE
  $ oclif apps

TOPICS
  apps:admin  This topic is for the apps topic

COMMANDS
  apps:create  Create an app`)
  })
})

describe('showHelp routing', () => {
  describe('shows root help', () => {
    test
    .setupHelp()
    .it('shows root help when no subject is provided', async ({help, stubs}) => {
      await help.showHelp([])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('shows root help when help is the only arg', async ({help, stubs}) => {
      await help.showHelp(['help'])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('shows topic help', () => {
    test
    .setupHelp()
    .makeTopicsWithoutCommand()
    .it('shows the topic help when a topic has no matching command', async ({help, stubs}) => {
      await help.showHelp(['plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })

    test
    .setupHelp()
    .makeTopicsWithoutCommand()
    .it('shows the topic help when a topic has no matching command and is preceded by help', async ({help, stubs}) => {
      await help.showHelp(['help', 'plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })
  })

  describe('shows command help', () => {
    test
    .setupHelp()
    .it('calls showCommandHelp when a topic that is also a command is called', async ({help, stubs}) => {
      await help.showHelp(['plugins'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('calls showCommandHelp when a command is called', async ({help, stubs}) => {
      await help.showHelp(['plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('calls showCommandHelp when a command is preceded by the help arg', async ({help, stubs}) => {
      await help.showHelp(['help', 'plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('errors', () => {
    test
    .setupHelp()
    .it('shows an error when there is a subject but it does not match a topic or command', async ({help}) => {
      await expect(help.showHelp(['meow'])).to.be.rejectedWith('Command meow not found')
    })
  })
})
