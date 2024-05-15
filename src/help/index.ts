import ansis from 'ansis'

import {Command} from '../command'
import {tsPath} from '../config/ts-path'
import {error} from '../errors/error'
import * as Interfaces from '../interfaces'
import {HelpLocationOptions} from '../interfaces/pjson'
import {load} from '../module-loader'
import {SINGLE_COMMAND_CLI_SYMBOL} from '../symbols'
import {cacheDefaultValue} from '../util/cache-default-value'
import {toConfiguredId} from '../util/ids'
import {compact, sortBy, uniqBy} from '../util/util'
import {ux} from '../ux'
import {colorize} from '../ux/theme'
import {CommandHelp} from './command'
import {HelpFormatter} from './formatter'
import RootHelp from './root'
import {formatCommandDeprecationWarning, getHelpFlagAdditions, standardizeIDFromArgv} from './util'
export {CommandHelp} from './command'
export {HelpFormatter, type HelpSection, type HelpSectionKeyValueTable, type HelpSectionRenderer} from './formatter'
export {getHelpFlagAdditions, normalizeArgv, standardizeIDFromArgv} from './util'

function getHelpSubject(args: string[], config: Interfaces.Config): string | undefined {
  // for each help flag that starts with '--' create a new flag with same name sans '--'
  const mergedHelpFlags = getHelpFlagAdditions(config)
  for (const arg of args) {
    if (arg === '--') return
    if (mergedHelpFlags.includes(arg) || arg === 'help') continue
    if (arg.startsWith('-')) return
    return arg
  }
}

export abstract class HelpBase extends HelpFormatter {
  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
    if (!config.topicSeparator) config.topicSeparator = ':' // back-support @oclif/config
  }

  /**
   * Show help for an individual command
   * @param command
   * @param topics
   */
  public abstract showCommandHelp(command: Command.Loadable, topics: Interfaces.Topic[]): Promise<void>

  /**
   * Show help, used in multi-command CLIs
   * @param args passed into your command, useful for determining which type of help to display
   */
  public abstract showHelp(argv: string[]): Promise<void>
}

export class Help extends HelpBase {
  protected CommandHelpClass: typeof CommandHelp = CommandHelp

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
  }

  protected get sortedCommands(): Command.Loadable[] {
    let {commands} = this.config

    commands = commands.filter((c) => this.opts.all || !c.hidden)
    commands = sortBy(commands, (c) => c.id)
    commands = uniqBy(commands, (c) => c.id)

    return commands
  }

  protected get sortedTopics(): Interfaces.Topic[] {
    let topics = this._topics
    topics = topics.filter((t) => this.opts.all || !t.hidden)
    topics = sortBy(topics, (t) => t.name)
    topics = uniqBy(topics, (t) => t.name)

    return topics
  }

  protected command(command: Command.Loadable): string {
    return this.formatCommand(command)
  }

  protected description(c: Command.Loadable): string {
    const description = this.render(c.description || '')
    if (c.summary) {
      return description
    }

    return description.split('\n').slice(1).join('\n')
  }

  protected formatCommand(command: Command.Loadable): string {
    if (this.config.topicSeparator !== ':') {
      command.id = command.id.replaceAll(':', this.config.topicSeparator)
      command.aliases = command.aliases && command.aliases.map((a) => a.replaceAll(':', this.config.topicSeparator))
    }

    const help = this.getCommandHelpClass(command)
    return help.generate()
  }

  protected formatCommands(commands: Array<Command.Loadable>): string {
    if (commands.length === 0) return ''
    const body = this.renderList(
      commands
        .filter((c) => (this.opts.hideAliasesFromRoot ? !c.aliases?.includes(c.id) : true))
        .map((c) => {
          if (this.config.topicSeparator !== ':') c.id = c.id.replaceAll(':', this.config.topicSeparator)
          const summary = this.summary(c)
          return [
            colorize(this.config?.theme?.command, c.id),
            summary && colorize(this.config?.theme?.sectionDescription, ansis.strip(summary)),
          ]
        }),
      {
        indentation: 2,
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
      },
    )

    return this.section('COMMANDS', body)
  }

  protected formatRoot(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  protected formatTopic(topic: Interfaces.Topic): string {
    let description = this.render(topic.description || '')
    const summary = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    let topicID = `${topic.name}:COMMAND`
    if (this.config.topicSeparator !== ':') topicID = topicID.replaceAll(':', this.config.topicSeparator)
    let output = compact([
      colorize(this.config?.theme?.commandSummary, summary),
      this.section(
        this.opts.usageHeader || 'USAGE',
        `${colorize(this.config?.theme?.dollarSign, '$')} ${colorize(
          this.config?.theme?.bin,
          this.config.bin,
        )} ${topicID}`,
      ),
      description &&
        this.section('DESCRIPTION', this.wrap(colorize(this.config?.theme?.sectionDescription, description))),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = ansis.strip(output)
    return output + '\n'
  }

  protected formatTopics(topics: Interfaces.Topic[]): string {
    if (topics.length === 0) return ''
    const body = this.renderList(
      topics.map((c) => {
        if (this.config.topicSeparator !== ':') c.name = c.name.replaceAll(':', this.config.topicSeparator)
        return [
          colorize(this.config?.theme?.topic, c.name),
          c.description && this.render(colorize(this.config?.theme?.sectionDescription, c.description.split('\n')[0])),
        ]
      }),
      {
        indentation: 2,
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
      },
    )
    return this.section('TOPICS', body)
  }

  protected getCommandHelpClass(command: Command.Loadable): CommandHelp {
    return new this.CommandHelpClass(command, this.config, this.opts)
  }

  protected log(...args: string[]) {
    this.opts.sendToStderr ? ux.stderr(args) : ux.stdout(args)
  }

  public async showCommandHelp(command: Command.Loadable): Promise<void> {
    const name = command.id
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(
      (t) => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1,
    )
    const subCommands = this.sortedCommands.filter(
      (c) => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1,
    )
    const plugin = this.config.plugins.get(command.pluginName!)

    const state = this.config.pjson?.oclif?.state || plugin?.pjson?.oclif?.state || command.state

    if (state) {
      this.log(
        state === 'deprecated'
          ? `${formatCommandDeprecationWarning(toConfiguredId(name, this.config), command.deprecationOptions)}\n`
          : `This command is in ${state}.\n`,
      )
    }

    if (command.deprecateAliases && command.aliases.includes(name)) {
      const actualCmd = this.config.commands.find((c) => c.aliases.includes(name))
      const opts = {...command.deprecationOptions, ...(actualCmd ? {to: actualCmd.id} : {})}
      this.log(`${formatCommandDeprecationWarning(toConfiguredId(name, this.config), opts)}\n`)
    }

    const summary = this.summary(command)
    if (summary) {
      this.log(summary + '\n')
    }

    this.log(this.formatCommand(command))
    this.log('')

    if (subTopics.length > 0) {
      this.log(this.formatTopics(subTopics))
      this.log('')
    }

    if (subCommands.length > 0) {
      const aliases: string[] = []
      const uniqueSubCommands: Command.Loadable[] = subCommands.filter((p) => {
        aliases.push(...p.aliases)
        return !aliases.includes(p.id)
      })
      this.log(this.formatCommands(uniqueSubCommands))
      this.log('')
    }
  }

  public async showHelp(argv: string[]): Promise<void> {
    const originalArgv = argv.slice(1)
    argv = argv.filter((arg) => !getHelpFlagAdditions(this.config).includes(arg))

    if (this.config.topicSeparator !== ':') argv = standardizeIDFromArgv(argv, this.config)
    const subject = getHelpSubject(argv, this.config)
    if (!subject) {
      if (this.config.isSingleCommandCLI) {
        const rootCmd = this.config.findCommand(SINGLE_COMMAND_CLI_SYMBOL)
        if (rootCmd) {
          await this.showCommandHelp(rootCmd)
          return
        }
      }

      await this.showRootHelp()
      return
    }

    const command = this.config.findCommand(subject)
    if (command) {
      if (command.id === SINGLE_COMMAND_CLI_SYMBOL) {
        // If the command is the root command of a single command CLI,
        // then set the command id to an empty string to prevent the
        // the SINGLE_COMMAND_CLI_SYMBOL from being displayed in the help output.
        command.id = ''
      }

      if (command.hasDynamicHelp && command.pluginType !== 'jit') {
        const loaded = await command.load()
        for (const [name, flag] of Object.entries(loaded.flags ?? {})) {
          // As of v3 each flag that needs to be re-evaluated has the `hasDynamicHelp` property.
          // However, we cannot assume that the absence of this property means that the flag
          // doesn't need to be re-evaluated since any command from a v2 or older plugin will
          // not have the `hasDynamicHelp` property on it.

          // In the future we could improve performance by skipping any flag that doesn't
          // have `hasDynamicHelp === true`

          if (flag.type === 'boolean') continue
          // eslint-disable-next-line no-await-in-loop
          command.flags[name].default = await cacheDefaultValue(flag, false)
        }

        await this.showCommandHelp(command)
      } else {
        await this.showCommandHelp(command)
      }

      return
    }

    const topic = this.config.findTopic(subject)
    if (topic) {
      await this.showTopicHelp(topic)
      return
    }

    if (this.config.flexibleTaxonomy) {
      const matches = this.config.findMatches(subject, originalArgv)
      if (matches.length > 0) {
        const result = await this.config.runHook('command_incomplete', {
          argv: originalArgv.filter((o) => !subject.split(':').includes(o)),
          id: subject,
          matches,
        })
        if (result.successes.length > 0) return
      }
    }

    error(`Command ${subject} not found.`)
  }

  protected async showRootHelp(): Promise<void> {
    let rootTopics = this.sortedTopics
    let rootCommands = this.sortedCommands

    const state = this.config.pjson?.oclif?.state
    if (state) {
      this.log(state === 'deprecated' ? `${this.config.bin} is deprecated` : `${this.config.bin} is in ${state}.\n`)
    }

    this.log(this.formatRoot())
    this.log('')

    if (!this.opts.all) {
      rootTopics = rootTopics.filter((t) => !t.name.includes(':'))
      rootCommands = rootCommands.filter((c) => !c.id.includes(':'))
    }

    if (rootTopics.length > 0) {
      this.log(this.formatTopics(rootTopics))
      this.log('')
    }

    if (rootCommands.length > 0) {
      rootCommands = rootCommands.filter((c) => c.id)
      this.log(this.formatCommands(rootCommands))
      this.log('')
    }
  }

  protected async showTopicHelp(topic: Interfaces.Topic): Promise<void> {
    const {name} = topic
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(
      (t) => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1,
    )
    const commands = this.sortedCommands.filter(
      (c) => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1,
    )

    const state = this.config.pjson?.oclif?.state
    if (state) this.log(`This topic is in ${state}.\n`)

    this.log(this.formatTopic(topic))

    if (subTopics.length > 0) {
      this.log(this.formatTopics(subTopics))
      this.log('')
    }

    if (commands.length > 0) {
      this.log(this.formatCommands(commands))
      this.log('')
    }
  }

  protected summary(c: Command.Loadable): string | undefined {
    if (this.opts.sections && !this.opts.sections.map((s) => s.toLowerCase()).includes('summary')) return
    if (c.summary) return colorize(this.config?.theme?.commandSummary, this.render(c.summary.split('\n')[0]))
    return c.description && colorize(this.config?.theme?.commandSummary, this.render(c.description).split('\n')[0])
  }

  /*
   * _topics is to work around Interfaces.topics mistakenly including commands that do
   * not have children, as well as topics. A topic has children, either commands or other topics. When
   * this is fixed upstream config.topics should return *only* topics with children,
   * and this can be removed.
   */
  private get _topics(): Interfaces.Topic[] {
    return this.config.topics.filter((topic: Interfaces.Topic) => {
      // it is assumed a topic has a child if it has children
      const hasChild = this.config.topics.some((subTopic) => subTopic.name.includes(`${topic.name}:`))
      return hasChild
    })
  }
}

interface HelpBaseDerived {
  new (config: Interfaces.Config, opts?: Partial<Interfaces.HelpOptions>): HelpBase
}

function extractClass(exported: any): HelpBaseDerived {
  return exported && exported.default ? exported.default : exported
}

function determineLocation(helpClass: string | HelpLocationOptions): HelpLocationOptions {
  if (typeof helpClass === 'string') return {identifier: 'default', target: helpClass}
  if (!helpClass.identifier) return {...helpClass, identifier: 'default'}
  return helpClass
}

export async function loadHelpClass(config: Interfaces.Config): Promise<HelpBaseDerived> {
  if (config.pjson.oclif?.helpClass) {
    const {identifier, target} = determineLocation(config.pjson.oclif?.helpClass)
    try {
      const path = (await tsPath(config.root, target)) ?? target
      const module = await load(config, path)
      const helpClass = module[identifier] ?? (identifier === 'default' ? extractClass(module) : undefined)
      return extractClass(helpClass)
    } catch (error: any) {
      throw new Error(`Unable to load configured help class "${target}", failed with message:\n${error.message}`)
    }
  }

  return Help
}
