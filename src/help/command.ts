import * as Chalk from 'chalk'
import stripAnsi = require('strip-ansi')

import {castArray, compact, sortBy} from '../util'
import * as Interfaces from '../interfaces'
import {Example} from '../interfaces/command'
import {HelpFormatter, HelpSection, HelpSectionRenderer} from './formatter'
import {DocOpts} from './docopts'

// Don't use os.EOL because we need to ensure that a string
// written on any platform, that may use \r\n or \n, will be
// split on any platform, not just the os specific EOL at runtime.
const POSSIBLE_LINE_FEED = /\r\n|\n/

const {
  underline,
} = Chalk
let {
  dim,
} = Chalk

if (process.env.ConEmuANSI === 'ON') {
  // eslint-disable-next-line unicorn/consistent-destructuring
  dim = Chalk.gray
}

export class CommandHelp extends HelpFormatter {
  constructor(
    public command: Interfaces.Command,
    public config: Interfaces.Config,
    public opts: Interfaces.HelpOptions) {
    super(config, opts)
  }

  generate(): string {
    const cmd = this.command
    const flags = sortBy(Object.entries(cmd.flags || {})
    .filter(([, v]) => !v.hidden)
    .map(([k, v]) => {
      v.name = k
      return v
    }), f => [!f.char, f.char, f.name])

    const args = (cmd.args || []).filter(a => !a.hidden)
    const output = compact(this.sections().map(({header, generate}) => {
      const body = generate({cmd, flags, args}, header)
      // Generate can return a list of sections
      if (Array.isArray(body)) {
        return body.map(helpSection => helpSection && helpSection.body && this.section(helpSection.header, helpSection.body)).join('\n\n')
      }

      return body && this.section(header, body)
    })).join('\n\n')
    return output
  }

  protected groupFlags(flags: Interfaces.Command.Flag[]) {
    const mainFlags: Interfaces.Command.Flag[] = []
    const flagGroups: { [index: string]: Interfaces.Command.Flag[] } = {}

    for (const flag of flags) {
      const group = flag.helpGroup

      if (group) {
        if (!flagGroups[group]) flagGroups[group] = []
        flagGroups[group].push(flag)
      } else {
        mainFlags.push(flag)
      }
    }

    return {mainFlags, flagGroups}
  }

  protected sections(): Array<{ header: string; generate: HelpSectionRenderer }> {
    return [
      {
        header: this.opts.usageHeader || 'USAGE',
        generate: () => this.usage(),
      },
      {
        header: 'ARGUMENTS',
        generate: ({args}, header) => [{header, body: this.args(args)}],
      },
      {
        header: 'FLAGS',
        generate: ({flags}, header) => {
          const {mainFlags, flagGroups} = this.groupFlags(flags)

          const flagSections: HelpSection[] = []
          const mainFlagBody = this.flags(mainFlags)

          if (mainFlagBody) flagSections.push({header, body: mainFlagBody})

          for (const [name, flags] of Object.entries(flagGroups)) {
            const body = this.flags(flags)
            if (body) flagSections.push({header: `${name.toUpperCase()} ${header}`, body})
          }

          return compact<HelpSection>(flagSections)
        },
      },
      {
        header: 'DESCRIPTION',
        generate: () => this.description(),
      },
      {
        header: 'ALIASES',
        generate: ({cmd}) => this.aliases(cmd.aliases),
      },
      {
        header: 'EXAMPLES',
        generate: ({cmd}) => {
          const examples = cmd.examples || (cmd as any).example
          return this.examples(examples)
        },
      },
      {
        header: 'FLAG DESCRIPTIONS',
        generate: ({flags}) => this.flagsDescriptions(flags),
      },
    ]
  }

  protected usage(): string {
    const usage = this.command.usage
    const body = (usage ? castArray(usage) : [this.defaultUsage()])
    .map(u => {
      const allowedSpacing = this.opts.maxWidth - this.indentSpacing
      const line = `$ ${this.config.bin} ${u}`.trim()
      if (line.length > allowedSpacing) {
        const splitIndex = line.slice(0, Math.max(0, allowedSpacing)).lastIndexOf(' ')
        return line.slice(0, Math.max(0, splitIndex)) + '\n' +
            this.indent(this.wrap(line.slice(Math.max(0, splitIndex)), this.indentSpacing * 2))
      }

      return this.wrap(line)
    })
    .join('\n')
    return body
  }

  protected defaultUsage(): string {
    // Docopts by default
    if (this.opts.docopts === undefined || this.opts.docopts) {
      return DocOpts.generate(this.command)
    }

    return compact([
      this.command.id,
      this.command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
    ]).join(' ')
  }

  protected description(): string | undefined {
    const cmd = this.command

    let description: string[] | undefined

    if (this.opts.hideCommandSummaryInDescription) {
      description = (cmd.description || '').split(POSSIBLE_LINE_FEED).slice(1)
    } else if (cmd.description) {
      description = [
        ...(cmd.summary || '').split(POSSIBLE_LINE_FEED),
        ...(cmd.description || '').split(POSSIBLE_LINE_FEED),
      ]
    }

    if (description) {
      // Lines separated with only one newline or more than 2 can be hard to read in the terminal.
      // Always separate by two newlines.
      return this.wrap(compact(description).join('\n\n'))
    }
  }

  protected aliases(aliases: string[] | undefined): string | undefined {
    if (!aliases || aliases.length === 0) return
    const body = aliases.map(a => ['$', this.config.bin, a].join(' ')).join('\n')
    return body
  }

  protected examples(examples: Example[] | undefined | string): string | undefined {
    if (!examples || examples.length === 0) return

    const formatIfCommand = (example: string): string => {
      example = this.render(example)
      if (example.startsWith(this.config.bin)) return dim(`$ ${example}`)
      if (example.startsWith(`$ ${this.config.bin}`)) return dim(example)
      return example
    }

    const isCommand = (example: string) => stripAnsi(formatIfCommand(example)).startsWith(`$ ${this.config.bin}`)

    const body = castArray(examples).map(a => {
      let description
      let commands
      if (typeof a === 'string') {
        const lines = a
        .split(POSSIBLE_LINE_FEED)
        .filter(line => Boolean(line))
        // If the example is <description>\n<command> then format correctly
        // eslint-disable-next-line unicorn/no-array-callback-reference
        if (lines.length >= 2 && !isCommand(lines[0]) && lines.slice(1).every(isCommand)) {
          description = lines[0]
          commands = lines.slice(1)
        } else {
          return lines.map(line => formatIfCommand(line)).join('\n')
        }
      } else {
        description = a.description
        commands = [a.command]
      }

      const multilineSeparator =
        this.config.platform === 'win32' ?
          (this.config.shell.includes('powershell') ? '`' : '^') :
          '\\'

      // The command will be indented in the section, which is also indented
      const finalIndentedSpacing = this.indentSpacing * 2
      const multilineCommands = commands.map(c => {
        // First indent keeping room for escaped newlines
        return this.indent(this.wrap(formatIfCommand(c), finalIndentedSpacing + 4))
        // Then add the escaped newline
        .split(POSSIBLE_LINE_FEED).join(` ${multilineSeparator}\n  `)
      }).join('\n')

      return `${this.wrap(description, finalIndentedSpacing)}\n\n${multilineCommands}`
    }).join('\n\n')
    return body
  }

  protected args(args: Interfaces.Command['args']): [string, string | undefined][] | undefined {
    if (args.filter(a => a.description).length === 0) return

    return args.map(a => {
      const name = a.name.toUpperCase()
      let description = a.description || ''
      if (a.default) description = `[default: ${a.default}] ${description}`
      if (a.options) description = `(${a.options.join('|')}) ${description}`
      return [name, description ? dim(description) : undefined]
    })
  }

  protected arg(arg: Interfaces.Command['args'][0]): string {
    const name = arg.name.toUpperCase()
    if (arg.required) return `${name}`
    return `[${name}]`
  }

  protected flagHelpLabel(flag: Interfaces.Command.Flag, showOptions = false) {
    let label = flag.helpLabel

    if (!label) {
      const labels = []
      if (flag.char) labels.push(`-${flag.char[0]}`)
      if (flag.name) {
        if (flag.type === 'boolean' && flag.allowNo) {
          labels.push(`--[no-]${flag.name.trim()}`)
        } else {
          labels.push(`--${flag.name.trim()}`)
        }
      }

      label = labels.join(', ')
    }

    if (flag.type === 'option') {
      let value = flag.helpValue || (this.opts.showFlagNameInTitle ? flag.name : '<value>')
      if (!flag.helpValue && flag.options) {
        value = showOptions || this.opts.showFlagOptionsInTitle ? `${flag.options.join('|')}` : '<option>'
      }

      if (flag.multiple) value += '...'
      if (!value.includes('|')) value = underline(value)
      label += `=${value}`
    }

    return label
  }

  protected flags(flags: Interfaces.Command.Flag[]): [string, string | undefined][] | undefined {
    if (flags.length === 0) return

    return flags.map(flag => {
      const left = this.flagHelpLabel(flag)

      let right = flag.summary || flag.description || ''
      if (flag.type === 'option' && flag.default) {
        right = `[default: ${flag.default}] ${right}`
      }

      if (flag.required) right = `(required) ${right}`

      if (flag.type === 'option' && flag.options && !flag.helpValue && !this.opts.showFlagOptionsInTitle) {
        right += `\n<options: ${flag.options.join('|')}>`
      }

      return [left, dim(right.trim())]
    })
  }

  protected flagsDescriptions(flags: Interfaces.Command.Flag[]): string | undefined {
    const flagsWithExtendedDescriptions = flags.filter(flag => flag.summary && flag.description)
    if (flagsWithExtendedDescriptions.length === 0) return

    const body = flagsWithExtendedDescriptions.map(flag => {
      // Guaranteed to be set because of the filter above, but make ts happy
      const summary = flag.summary || ''
      let flagHelp = this.flagHelpLabel(flag, true)
      flagHelp += flagHelp.length + summary.length + 2 < this.opts.maxWidth ? '  ' + summary : '\n\n' + this.indent(this.wrap(summary, this.indentSpacing * 2))
      return `${flagHelp}\n\n${this.indent(this.wrap(flag.description || '', this.indentSpacing * 2))}`
    }).join('\n\n')

    return body
  }
}
export default CommandHelp
