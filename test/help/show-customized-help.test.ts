import {expect, test as base} from '@oclif/test'
import {stub, SinonStub} from 'sinon'
import * as path from 'path'

import {CommandHelp, Help} from '../../src/help'
import {AppsIndexWithDesc, AppsDestroy, AppsCreate, AppsTopic, AppsAdminTopic, AppsAdminAdd} from './fixtures/fixtures'
import {Interfaces, Config} from '../../src'
import {CommandImport} from '../../src/command'

const g: any = global
g.oclif.columns = 80

// Allow overriding section headers
class TestCommandHelp extends CommandHelp {
  protected sections() {
    const sectionsToRemove = new Set(['DESCRIPTION'])
    let sections = super.sections()

    sections = sections.filter(section => !sectionsToRemove.has(section.header))

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

  public config: any;

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
    this.opts.usageHeader = 'SYNOPSIS'
  }

  summary(c: CommandImport): string {
    // This will essentially ignore the summary
    return this.wrap(c.description || '')
  }

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
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsIndexWithDesc, AppsCreate, AppsDestroy],
      topics: [],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp([])
  })
  .it('shows a command and topic when the index has siblings', ({stdout, config}) => {
    expect(stdout.trim()).to.equal(`base library for oclif CLIs

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

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsIndexWithDesc],
      topics: [],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp([])
  })
  .it('shows a command only when the topic only contains an index', ({stdout, config}) => {
    expect(stdout.trim()).to.equal(`base library for oclif CLIs

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
    expect(stdout.trim()).to.equal(`this only shows up in command help under DESCRIPTION

SYNOPSIS
  $ oclif apps:create

CUSTOM
  my custom section

    force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it force  it force  it force
    it force  it force  it force  it force  it force  it`)
  })

  test
  .loadConfig()
  .stdout()
  .do(async ctx => {
    const config = ctx.config;

    (config as any).plugins = [{
      commands: [AppsIndexWithDesc, AppsCreate, AppsAdminAdd],
      topics: [AppsTopic, AppsAdminTopic],
    }]

    const help = new TestHelp(config as any)
    await help.showHelp(['apps'])
  })
  .it('shows help for a command that has children topics and commands', ({stdout}) => {
    expect(stdout.trim()).to.equal(`List all apps (app index command)
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
