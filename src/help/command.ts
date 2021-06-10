import * as Chalk from 'chalk'
import stripAnsi = require('strip-ansi')

import {castArray, compact, sortBy} from '../util'
import * as Interfaces from '../interfaces'
import {Example} from '../interfaces/command'
import {HelpFormatter} from './formatter'

const {
  underline,
} = Chalk
let {
  dim,
} = Chalk

if (process.env.ConEmuANSI === 'ON') {
  dim = Chalk.gray
}

export type HelpSection = {header: string; body: string | [string, string | undefined][] | undefined} | undefined;
export type HelpSectionRenderer = (data: {cmd: Interfaces.Command; flags: Interfaces.Command.Flag[]; args: Interfaces.Command.Arg[]}, header: string) => HelpSection[] | string | undefined;

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
    const flagGroups: {[index: string]: Interfaces.Command.Flag[]} = {}

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

  protected sections(): Array<{header: string; generate: HelpSectionRenderer}> {
    return [
      {
        header: this.opts.usageHeader || 'USAGE',
        generate: ({flags}) => this.usage(flags),
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

          Object.entries(flagGroups).forEach(([name, flags]) => {
            const body = this.flags(flags)
            if (body) flagSections.push({header: `${name.toUpperCase()} ${header}`, body})
          })

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

  protected usage(flags: Interfaces.Command.Flag[]): string {
    const usage = this.command.usage
    const body = (usage ? castArray(usage) : [this.defaultUsage(flags)])
    .map(u => `$ ${this.config.bin} ${u}`.trim())
    .join('\n')
    return this.wrap(body)
  }

  protected defaultUsage(_: Interfaces.Command.Flag[]): string {
    return compact([
      this.command.id,
      this.command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
    ]).join(' ')
  }

  protected description(): string | undefined {
    const cmd = this.command

    let description: string[]

    if (this.opts.hideCommandSummaryInDescription) {
      description = (cmd.description || '').split('\n').slice(1)
    } else {
      description = [
        ...(cmd.summary || '').split('\n'),
        ...(cmd.description || '').split('\n'),
      ]
    }

    // Lines separated with only one newline or more than 2 can be hard to read in the terminal.
    // Always separate by two newlines.
    return this.wrap(compact(description).join('\n\n'))
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
      let command
      if (typeof a === 'string') {
        const lines = a
        .split('\n')
        .filter(line => Boolean(line))
        // If the example is <description>\n<command> then format correctly
        if (lines.length === 2 && !isCommand(lines[0]) && isCommand(lines[1])) {
          description = lines[0]
          command = lines[1]
        } else {
          return lines.map(line => formatIfCommand(line)).join('\n')
        }
      } else {
        description = a.description
        command = a.command
      }

      const multilineSeparator =
        this.config.platform === 'win32' ?
          this.config.shell.includes('powershell') ? '`' : '^' :
          '\\'

      // The command will be indented in the section, which is also indented
      const finalIndentedSpacing = this.indentSpacing * 2
      // First indent keeping room for escaped newlines
      const multilineCommand = this.indent(this.wrap(formatIfCommand(command), finalIndentedSpacing + 4))
      // Then add the escaped newline
      .split('\n').join(` ${multilineSeparator}\n  `)

      return `${this.wrap(description, finalIndentedSpacing)}\n\n${multilineCommand}`
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
        if (showOptions || this.opts.showFlagOptionsInTitle) value = `${flag.options.join('|')}`
        else value = '<option>'
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
    const flagsWithExtendedDescriptions = flags.filter(flag => (flag.summary && flag.description && flag.description.split('\n').length > 1))
    if (flagsWithExtendedDescriptions.length === 0) return

    const body = flagsWithExtendedDescriptions.map(flag => {
      return `${this.flagHelpLabel(flag, true)}\n\n${this.indent(this.wrap(flag.description || '', this.indentSpacing * 2))}`
    }).join('\n\n')

    return body
  }
}
export default CommandHelp
