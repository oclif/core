import * as Config from '@oclif/config'
import {error} from '@oclif/errors'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {compact, sortBy, template, uniqBy} from './util'
import {getHelpClass} from './util'

const wrap = require('wrap-ansi')
const {
  bold,
} = chalk

export interface HelpOptions {
  all?: boolean;
  maxWidth: number;
  stripAnsi?: boolean;
}

function getHelpSubject(args: string[]): string | undefined {
  for (const arg of args) {
    if (arg === '--') return
    if (arg.startsWith('-')) continue
    if (arg === 'help') continue
    return arg
  }
}

export abstract class HelpBase {
  constructor(config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    this.config = config
    this.opts = {maxWidth: stdtermwidth, ...opts}
  }

  protected config: Config.IConfig

  protected opts: HelpOptions

  /**
   * Show help, used in multi-command CLIs
   * @param args passed into your command, useful for determining which type of help to display
   */
  public abstract showHelp(argv: string[]): void;

  /**
   * Show help for an individual command
   * @param command
   * @param topics
   */
  public abstract showCommandHelp(command: Config.Command, topics: Config.Topic[]): void;
}

export default class Help extends HelpBase {
  render: (input: string) => string

  /*
   * _topics is to work around Config.topics mistakenly including commands that do
   * not have children, as well as topics. A topic has children, either commands or other topics. When
   * this is fixed upstream config.topics should return *only* topics with children,
   * and this can be removed.
   */
  private get _topics(): Config.Topic[] {
    return this.config.topics.filter((topic: Config.Topic) => {
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

  constructor(config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    super(config, opts)
    this.render = template(this)
  }

  public showHelp(argv: string[]) {
    const subject = getHelpSubject(argv)
    if (!subject) {
      this.showRootHelp()
      return
    }

    const command = this.config.findCommand(subject)
    if (command) {
      this.showCommandHelp(command)
      return
    }

    const topic = this.config.findTopic(subject)
    if (topic)  {
      this.showTopicHelp(topic)
      return
    }

    error(`command ${subject} not found`)
  }

  public showCommandHelp(command: Config.Command) {
    const name = command.id
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const subCommands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1)

    const title = command.description && this.render(command.description).split('\n')[0]
    if (title) console.log(title + '\n')
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

  protected showRootHelp() {
    let rootTopics = this.sortedTopics
    let rootCommands = this.sortedCommands

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
      console.log(this.formatCommands(rootCommands))
      console.log('')
    }
  }

  protected showTopicHelp(topic: Config.Topic) {
    const name = topic.name
    const depth = name.split(':').length

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const commands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1)

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

  protected formatCommand(command: Config.Command): string {
    const help = new CommandHelp(command, this.config, this.opts)
    return help.generate()
  }

  protected formatCommands(commands: Config.Command[]): string {
    if (commands.length === 0) return ''

    const body = renderList(commands.map(c => [
      c.id,
      c.description && this.render(c.description.split('\n')[0]),
    ]), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })

    return [
      bold('COMMANDS'),
      indent(body, 2),
    ].join('\n')
  }

  protected formatTopic(topic: Config.Topic): string {
    let description = this.render(topic.description || '')
    const title = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    let output = compact([
      title,
      [
        bold('USAGE'),
        indent(wrap(`$ ${this.config.bin} ${topic.name}:COMMAND`, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n'),
      description && ([
        bold('DESCRIPTION'),
        indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n')),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output + '\n'
  }

  protected formatTopics(topics: Config.Topic[]): string {
    if (topics.length === 0) return ''
    const body = renderList(topics.map(c => [
      c.name,
      c.description && this.render(c.description.split('\n')[0]),
    ]), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })
    return [
      bold('TOPICS'),
      indent(body, 2),
    ].join('\n')
  }

  /**
   * @deprecated used for readme generation
   * @param {object} command The command to generate readme help for
   * @return {string} the readme help string for the given command
   */
  protected command(command: Config.Command) {
    return this.formatCommand(command)
  }
}

export {
  Help,
  getHelpClass,
}
