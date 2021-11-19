import stripAnsi = require('strip-ansi')

import * as Interfaces from '../interfaces'
import {error} from '../errors'
import CommandHelp from './command'
import RootHelp from './root'
import {compact, sortBy, uniqBy} from '../util'
import {standardizeIDFromArgv} from './util'
import {HelpFormatter} from './formatter'

export {CommandHelp} from './command'
export {standardizeIDFromArgv, loadHelpClass} from './util'

const helpFlags = ['--help']

export function getHelpFlagAdditions(config: Interfaces.Config): string[] {
  const additionalHelpFlags = config.pjson.oclif.additionalHelpFlags ?? []
  return [...new Set([...helpFlags, ...additionalHelpFlags]).values()]
}

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
   * Show help, used in multi-command CLIs
   * @param args passed into your command, useful for determining which type of help to display
   */
  public abstract showHelp(argv: string[]): Promise<void>;

  /**
   * Show help for an individual command
   * @param command
   * @param topics
   */
  public abstract showCommandHelp(command: Interfaces.Command, topics: Interfaces.Topic[]): Promise<void>;
}

export class Help extends HelpBase {
  protected CommandHelpClass: typeof CommandHelp = CommandHelp

  /*
   * _topics is to work around Interfaces.topics mistakenly including commands that do
   * not have children, as well as topics. A topic has children, either commands or other topics. When
   * this is fixed upstream config.topics should return *only* topics with children,
   * and this can be removed.
   */
  private get _topics(): Interfaces.Topic[] {
    return this.config.topics.filter((topic: Interfaces.Topic) => {
      // it is assumed a topic has a child if it has children
      const hasChild = this.config.topics.some(subTopic => subTopic.name.includes(`${topic.name}:`))
      return hasChild
    })
  }

  protected get sortedCommands() {
    let commands = this.config.commands

    commands = commands.filter(c => this.opts.all || !c.hidden)
    commands = sortBy(commands, c => c.id)
    commands = uniqBy(commands, c => c.id)

    return commands
  }

  protected get sortedTopics() {
    let topics = this._topics
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)

    return topics
  }

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    super(config, opts)
  }

  public async showHelp(argv: string[]) {
    argv = argv.filter(arg => !getHelpFlagAdditions(this.config).includes(arg))

    if (this.config.topicSeparator !== ':') argv = standardizeIDFromArgv(argv, this.config)
    const subject = getHelpSubject(argv, this.config)
    if (!subject) {
      if (this.config.pjson.oclif.default) {
        const rootCmd = this.config.findCommand(this.config.pjson.oclif.default)
        if (rootCmd) await this.showCommandHelp(rootCmd)
      }

      await this.showRootHelp()
      return
    }

    const command = this.config.findCommand(subject)
    if (command) {
      await this.showCommandHelp(command)
      return
    }

    const topic = this.config.findTopic(subject)
    if (topic) {
      await this.showTopicHelp(topic)
      return
    }

    error(`Command ${subject} not found.`)
  }

  public async showCommandHelp(command: Interfaces.Command) {
    const name = command.id
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const subCommands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1)
    const plugin = this.config.plugins.find(p => p.name === command.pluginName)

    const state = this.config.pjson?.oclif?.state || plugin?.pjson?.oclif?.state || command.state
    if (state) console.log(`This command is in ${state}.\n`)

    const summary = this.summary(command)
    if (summary) console.log(summary + '\n')
    console.log(this.formatCommand(command))
    console.log('')

    if (subTopics.length > 0) {
      console.log(this.formatTopics(subTopics))
      console.log('')
    }

    if (subCommands.length > 0) {
      console.log(this.formatCommands(subCommands))
      console.log('')
    }
  }

  protected async showRootHelp() {
    let rootTopics = this.sortedTopics
    let rootCommands = this.sortedCommands

    const state = this.config.pjson?.oclif?.state
    if (state) console.log(`${this.config.bin} is in ${state}.\n`)
    console.log(this.formatRoot())
    console.log('')

    if (!this.opts.all) {
      rootTopics = rootTopics.filter(t => !t.name.includes(':'))
      rootCommands = rootCommands.filter(c => !c.id.includes(':'))
    }

    if (rootTopics.length > 0) {
      console.log(this.formatTopics(rootTopics))
      console.log('')
    }

    if (rootCommands.length > 0) {
      rootCommands = rootCommands.filter(c => c.id)
      console.log(this.formatCommands(rootCommands))
      console.log('')
    }
  }

  protected async showTopicHelp(topic: Interfaces.Topic) {
    const name = topic.name
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const commands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1)

    const state = this.config.pjson?.oclif?.state
    if (state) console.log(`This topic is in ${state}.\n`)

    console.log(this.formatTopic(topic))

    if (subTopics.length > 0) {
      console.log(this.formatTopics(subTopics))
      console.log('')
    }

    if (commands.length > 0) {
      console.log(this.formatCommands(commands))
      console.log('')
    }
  }

  protected formatRoot(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  protected formatCommand(command: Interfaces.Command): string {
    if (this.config.topicSeparator !== ':') {
      command.id = command.id.replace(/:/g, this.config.topicSeparator)
      command.aliases = command.aliases && command.aliases.map(a => a.replace(/:/g, this.config.topicSeparator))
    }

    const help = this.getCommandHelpClass(command)
    return help.generate()
  }

  protected getCommandHelpClass(command: Interfaces.Command) {
    return new this.CommandHelpClass(command, this.config, this.opts)
  }

  protected formatCommands(commands: Interfaces.Command[]): string {
    if (commands.length === 0) return ''

    const body = this.renderList(commands.map(c => {
      if (this.config.topicSeparator !== ':') c.id = c.id.replace(/:/g, this.config.topicSeparator)
      return [
        c.id,
        this.summary(c),
      ]
    }), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      indentation: 2,
    })

    return this.section('COMMANDS', body)
  }

  protected summary(c: Interfaces.Command): string | undefined {
    if (c.summary) return this.render(c.summary.split('\n')[0])

    return c.description && this.render(c.description).split('\n')[0]
  }

  protected description(c: Interfaces.Command): string {
    const description = this.render(c.description || '')
    if (c.summary) {
      return description
    }

    return description.split('\n').slice(1).join('\n')
  }

  protected formatTopic(topic: Interfaces.Topic): string {
    let description = this.render(topic.description || '')
    const summary = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    let topicID = `${topic.name}:COMMAND`
    if (this.config.topicSeparator !== ':') topicID = topicID.replace(/:/g, this.config.topicSeparator)
    let output = compact([
      summary,
      this.section(this.opts.usageHeader || 'USAGE', `$ ${this.config.bin} ${topicID}`),
      description && this.section('DESCRIPTION', this.wrap(description)),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output + '\n'
  }

  protected formatTopics(topics: Interfaces.Topic[]): string {
    if (topics.length === 0) return ''
    const body = this.renderList(topics.map(c => {
      if (this.config.topicSeparator !== ':') c.name = c.name.replace(/:/g, this.config.topicSeparator)
      return [
        c.name,
        c.description && this.render(c.description.split('\n')[0]),
      ]
    }), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      indentation: 2,
    })
    return this.section('TOPICS', body)
  }

  /**
   * @deprecated used for readme generation
   * @param {object} command The command to generate readme help for
   * @return {string} the readme help string for the given command
   */
  protected command(command: Interfaces.Command) {
    return this.formatCommand(command)
  }
}
