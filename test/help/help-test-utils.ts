import {CommandImport, Loadable, Cached} from '../../src/command'
import stripAnsi = require('strip-ansi')

import {Interfaces, toCached} from '../../src'
import {Help, CommandHelp} from '../../src/help'

export class TestCommandHelp extends CommandHelp {
  protected sections() {
    const sections = super.sections()
    const flagSection = sections.find(section => section.header === 'FLAGS')
    if (flagSection) flagSection.header = 'OPTIONS'
    return sections
  }
}

// extensions to expose method as public for testing
export class TestHelpWithOptions extends Help {
  CommandHelpClass = TestCommandHelp

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
    this.opts.showFlagNameInTitle = true
    this.opts.showFlagOptionsInTitle = true
    this.opts.hideCommandSummaryInDescription = true
  }

  public formatCommand(command: CommandImport) {
    return super.formatCommand(command)
  }
}

// extensions to expose method as public for testing
export class TestHelp extends Help {
  public formatCommand(command: CommandImport | Loadable | Cached) {
    return super.formatCommand(command)
  }

  public formatTopics(topics: Interfaces.Topic[]) {
    return super.formatTopics(topics)
  }

  public formatTopic(topic: Interfaces.Topic) {
    return super.formatTopic(topic)
  }
}

export const commandHelp = (command?: any) => ({
  async run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const cached = await toCached(command!, {} as any)
    const help = ctx.help.formatCommand(cached)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }

    ctx.commandHelp = stripAnsi(help).split('\n').map(s => s.trimEnd()).join('\n')
    ctx.expectation = 'has commandHelp'
  },
})

export const topicsHelp = (topics: Interfaces.Topic[]) => ({
  run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const topicsHelpOutput = ctx.help.formatTopics(topics) || ''

    if (process.env.TEST_OUTPUT === '1') {
      console.log(topicsHelpOutput)
    }

    ctx.commandHelp = stripAnsi(topicsHelpOutput).split('\n').map(s => s.trimEnd()).join('\n')
    ctx.expectation = 'has topicsHelp'
  },
})

export const topicHelp = (topic: Interfaces.Topic) => ({
  run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const topicHelpOutput = ctx.help.formatTopic(topic)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(topicHelpOutput)
    }

    ctx.commandHelp = stripAnsi(topicHelpOutput).split('\n').map(s => s.trimEnd()).join('\n')
    ctx.expectation = 'has topicHelp'
  },
})
