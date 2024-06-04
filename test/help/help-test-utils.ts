import ansis from 'ansis'

import {Interfaces} from '../../src'
import {Command} from '../../src/command'
import {CommandHelp, Help} from '../../src/help'
import {cacheCommand} from '../../src/util/cache-command'

export class TestCommandHelp extends CommandHelp {
  protected sections() {
    const sections = super.sections()
    const flagSection = sections.find((section) => section.header === 'FLAGS')
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

  public formatCommand(command: Command.Loadable) {
    return cleanOutput(super.formatCommand(command))
  }
}

// extensions to expose method as public for testing
export class TestHelp extends Help {
  public formatCommand(command: Command.Loadable) {
    return cleanOutput(super.formatCommand(command))
  }

  public formatTopic(topic: Interfaces.Topic) {
    return super.formatTopic(topic)
  }

  public formatTopics(topics: Interfaces.Topic[]) {
    return super.formatTopics(topics)
  }
}

function cleanOutput(output: string) {
  return ansis
    .strip(output)
    .split('\n')
    .map((s) => s.trimEnd())
    .join('\n')
}

export async function makeLoadable(command: Command.Class, plugin?: Interfaces.Plugin): Promise<Command.Loadable> {
  return {
    ...(await cacheCommand(command, plugin)),
    load: async () => command,
  }
}

export function makeCommandClass(cmdProps: Partial<Command.Class & Command.Loadable>): Command.Class {
  return class extends Command {
    async run(): Promise<void> {
      // do nothing
    }

    static {
      Object.assign(this, cmdProps)
    }
  }
}

export function monkeyPatchCommands(
  config: any,
  plugins: Array<{name: string; commands: Command.Class[]; topics: Interfaces.Topic[]}>,
  override: boolean = true,
) {
  const pluginsMap = new Map()
  for (const plugin of plugins) {
    pluginsMap.set(plugin.name, plugin)
  }

  config.plugins = pluginsMap
  if (override) {
    // // @ts-expect-error private member
    config._commands = new Map()
    // // @ts-expect-error private member
    config._topics = new Map()
  }

  for (const plugin of config.plugins.values()) {
    // // @ts-expect-error private method
    config.loadCommands(plugin)
    // // @ts-expect-error private method
    config.loadTopics(plugin)
  }
}
