import ansis from 'ansis'

import {Command} from '../command'
import * as Interfaces from '../interfaces'
import {ensureArgObject} from '../util/ensure-arg-object'
import {toConfiguredId, toStandardizedId} from '../util/ids'
import {castArray, compact, sortBy} from '../util/util'
import {colorize} from '../ux/theme'
import {DocOpts} from './docopts'
import {HelpFormatter, HelpSection, HelpSectionRenderer} from './formatter'

// Don't use os.EOL because we need to ensure that a string
// written on any platform, that may use \r\n or \n, will be
// split on any platform, not just the os specific EOL at runtime.
const POSSIBLE_LINE_FEED = /\r\n|\n/

/**
 * Determines the sort order of flags. Will default to alphabetical if not set or set to an invalid value.
 */
function determineSortOrder(
  flagSortOrder: HelpFormatter['opts']['flagSortOrder'],
): NonNullable<HelpFormatter['opts']['flagSortOrder']> {
  if (flagSortOrder === 'alphabetical') return 'alphabetical'
  if (flagSortOrder === 'none') return 'none'
  return 'alphabetical'
}

export class CommandHelp extends HelpFormatter {
  constructor(
    public command: Command.Loadable,
    public config: Interfaces.Config,
    public opts: Interfaces.HelpOptions,
  ) {
    super(config, opts)
  }

  protected aliases(aliases: string[] | undefined): string | undefined {
    if (!aliases || aliases.length === 0) return
    const body = aliases
      .map((a) =>
        [
          colorize(this.config?.theme?.dollarSign, '$'),
          colorize(this.config?.theme?.bin, this.config.bin),
          colorize(this.config?.theme?.alias, a),
        ].join(' '),
      )
      .join('\n')
    return body
  }

  protected arg(arg: Command.Arg.Any): string {
    const name = arg.name.toUpperCase()
    if (arg.required) return `<${name}>`
    return `[${name}]`
  }

  protected args(args: Command.Arg.Any[]): [string, string | undefined][] | undefined {
    if (args.filter((a) => a.description).length === 0) return

    return args.map((a) => {
      // Add ellipsis to indicate that the argument takes multiple values if strict is false
      let name = this.command.strict === false ? `${a.name.toUpperCase()}...` : a.name.toUpperCase()
      name = a.required ? `<${name}>` : `[${name}]`
      let description = a.description || ''
      if (a.default)
        description = `${colorize(this.config?.theme?.flagDefaultValue, `[default: ${a.default}]`)} ${description}`
      if (a.options)
        description = `${colorize(this.config?.theme?.flagOptions, `(${a.options.join('|')})`)} ${description}`
      return [
        colorize(this.config?.theme?.flag, name),
        description ? colorize(this.config?.theme?.sectionDescription, description) : undefined,
      ]
    })
  }

  protected defaultUsage(): string {
    // Docopts by default
    if (this.opts.docopts === undefined || this.opts.docopts) {
      return DocOpts.generate(this.command)
    }

    return compact([
      this.command.id,
      Object.values(this.command.args ?? {})
        ?.filter((a) => !a.hidden)
        .map((a) => this.arg(a))
        .join(' '),
    ]).join(' ')
  }

  protected description(): string | undefined {
    const cmd = this.command

    let description: string[] | undefined
    if (this.opts.hideCommandSummaryInDescription) {
      description = (cmd.description || '').split(POSSIBLE_LINE_FEED).slice(1)
    } else if (cmd.description) {
      const summary = cmd.summary ? `${cmd.summary}\n` : null
      description = summary
        ? [...summary.split(POSSIBLE_LINE_FEED), ...(cmd.description || '').split(POSSIBLE_LINE_FEED)]
        : (cmd.description || '').split(POSSIBLE_LINE_FEED)
    }

    if (description) {
      return this.wrap(description.join('\n'))
    }
  }

  protected examples(examples: Command.Example[] | string | undefined): string | undefined {
    if (!examples || examples.length === 0) return

    const body = castArray(examples)
      .map((a) => {
        let description
        let commands
        if (typeof a === 'string') {
          const lines = a.split(POSSIBLE_LINE_FEED).filter(Boolean)
          // If the example is <description>\n<command> then format correctly
          if (lines.length >= 2 && !this.isCommand(lines[0]) && lines.slice(1).every((i) => this.isCommand(i))) {
            description = lines[0]
            commands = lines.slice(1)
          } else {
            return lines.map((line) => this.formatIfCommand(line)).join('\n')
          }
        } else {
          description = a.description
          commands = [a.command]
        }

        const multilineSeparator =
          this.config.platform === 'win32' ? (this.config.shell.includes('powershell') ? '`' : '^') : '\\'

        // The command will be indented in the section, which is also indented
        const finalIndentedSpacing = this.indentSpacing * 2
        const multilineCommands = commands
          .map((c) =>
            // First indent keeping room for escaped newlines
            this.indent(this.wrap(this.formatIfCommand(c), finalIndentedSpacing + 4))
              // Then add the escaped newline
              .split(POSSIBLE_LINE_FEED)
              .join(` ${multilineSeparator}\n  `),
          )
          .join('\n')

        return `${this.wrap(description, finalIndentedSpacing)}\n\n${multilineCommands}`
      })
      .join('\n\n')
    return body
  }

  protected flagHelpLabel(flag: Command.Flag.Any, showOptions = false): string {
    let label = flag.helpLabel

    if (!label) {
      const labels = []
      labels.push(flag.char ? `-${flag.char[0]}` : '  ')
      if (flag.name) {
        if (flag.type === 'boolean' && flag.allowNo) {
          labels.push(`--[no-]${flag.name.trim()}`)
        } else {
          labels.push(`--${flag.name.trim()}`)
        }
      }

      label = labels.join(flag.char ? colorize(this.config?.theme?.flagSeparator, ', ') : '  ')
    }

    if (flag.type === 'option') {
      let value = DocOpts.formatUsageType(
        flag,
        this.opts.showFlagNameInTitle ?? false,
        this.opts.showFlagOptionsInTitle ?? showOptions,
      )
      if (!value.includes('|')) value = colorize('underline', value)
      label += `=${value}`
    }

    return colorize(this.config.theme?.flag, label)
  }

  protected flags(flags: Array<Command.Flag.Any>): [string, string | undefined][] | undefined {
    if (flags.length === 0) return

    const noChar = flags.reduce((previous, current) => previous && current.char === undefined, true)

    // eslint-disable-next-line complexity
    return flags.map((flag) => {
      let left = this.flagHelpLabel(flag)

      if (noChar) left = left.replace('    ', '')

      let right = flag.summary || flag.description || ''
      const canBeCached = !(this.opts.respectNoCacheDefault === true && flag.noCacheDefault === true)
      if (flag.type === 'option' && flag.default && canBeCached) {
        right = `${colorize(this.config?.theme?.flagDefaultValue, `[default: ${flag.default}]`)} ${right}`
      }

      if (flag.required) right = `${colorize(this.config?.theme?.flagRequired, '(required)')} ${right}`

      if (flag.type === 'option' && flag.options && !flag.helpValue && !this.opts.showFlagOptionsInTitle) {
        right += colorize(this.config?.theme?.flagOptions, `\n<options: ${flag.options.join('|')}>`)
      }

      return [left, colorize(this.config?.theme?.sectionDescription, right.trim())]
    })
  }

  protected flagsDescriptions(flags: Array<Command.Flag.Any>): string | undefined {
    const flagsWithExtendedDescriptions = flags.filter((flag) => flag.summary && flag.description)
    if (flagsWithExtendedDescriptions.length === 0) return

    const body = flagsWithExtendedDescriptions
      .map((flag) => {
        // Guaranteed to be set because of the filter above, but make ts happy
        const summary = flag.summary || ''
        let flagHelp = this.flagHelpLabel(flag, true)

        if (!flag.char) flagHelp = flagHelp.replace('    ', '')

        flagHelp +=
          flagHelp.length + summary.length + 2 < this.opts.maxWidth
            ? '  ' + summary
            : '\n\n' + this.indent(this.wrap(summary, this.indentSpacing * 2))

        return `${flagHelp}\n\n${this.indent(this.wrap(flag.description || '', this.indentSpacing * 2))}`
      })
      .join('\n\n')

    return body
  }

  generate(): string {
    const cmd = this.command
    const unsortedFlags = Object.entries(cmd.flags || {})
      .filter(([, v]) => !v.hidden)
      .map(([k, v]) => {
        v.name = k
        return v
      })

    const flags =
      determineSortOrder(this.opts.flagSortOrder) === 'alphabetical'
        ? sortBy(unsortedFlags, (f) => [!f.char, f.char, f.name])
        : unsortedFlags

    const args = Object.values(ensureArgObject(cmd.args)).filter((a) => !a.hidden)
    const output = compact(
      this.sections().map(({generate, header}) => {
        const body = generate({args, cmd, flags}, header)
        // Generate can return a list of sections
        if (Array.isArray(body)) {
          return body
            .map((helpSection) => helpSection && helpSection.body && this.section(helpSection.header, helpSection.body))
            .join('\n\n')
        }

        return body && this.section(header, body)
      }),
    ).join('\n\n')
    return output
  }

  protected groupFlags(flags: Array<Command.Flag.Any>): {
    flagGroups: {[name: string]: Array<Command.Flag.Any>}
    mainFlags: Array<Command.Flag.Any>
  } {
    const mainFlags: Array<Command.Flag.Any> = []
    const flagGroups: {[index: string]: Array<Command.Flag.Any>} = {}

    for (const flag of flags) {
      const group = flag.helpGroup

      if (group) {
        if (!flagGroups[group]) flagGroups[group] = []
        flagGroups[group].push(flag)
      } else {
        mainFlags.push(flag)
      }
    }

    return {flagGroups, mainFlags}
  }

  protected sections(): Array<{generate: HelpSectionRenderer; header: string}> {
    const sections: Array<{generate: HelpSectionRenderer; header: string}> = [
      {
        generate: () => this.usage(),
        header: this.opts.usageHeader || 'USAGE',
      },
      {
        generate: ({args}, header) => [{body: this.args(args), header}],
        header: 'ARGUMENTS',
      },
      {
        generate: ({flags}, header) => {
          const {flagGroups, mainFlags} = this.groupFlags(flags)

          const flagSections: HelpSection[] = []
          const mainFlagBody = this.flags(mainFlags)

          if (mainFlagBody) flagSections.push({body: mainFlagBody, header})

          for (const [name, flags] of Object.entries(flagGroups)) {
            const body = this.flags(flags)
            if (body) flagSections.push({body, header: `${name.toUpperCase()} ${header}`})
          }

          return compact<HelpSection>(flagSections)
        },
        header: 'FLAGS',
      },
      {
        generate: () => this.description(),
        header: 'DESCRIPTION',
      },
      {
        generate: ({cmd}) => this.aliases(cmd.aliases),
        header: 'ALIASES',
      },
      {
        generate: ({cmd}) => {
          const examples = cmd.examples || (cmd as any).example
          return this.examples(examples)
        },
        header: 'EXAMPLES',
      },
      {
        generate: ({flags}) => this.flagsDescriptions(flags),
        header: 'FLAG DESCRIPTIONS',
      },
    ]

    const allowedSections = this.opts.sections?.map((s) => s.toLowerCase())

    return sections.filter(({header}) => !allowedSections || allowedSections.includes(header.toLowerCase()))
  }

  protected usage(): string {
    const {id, usage} = this.command
    const standardId = toStandardizedId(id, this.config)
    const configuredId = toConfiguredId(id, this.config)
    const body = (usage ? castArray(usage) : [this.defaultUsage()])
      .map((u) => {
        const allowedSpacing = this.opts.maxWidth - this.indentSpacing

        const dollarSign = colorize(this.config?.theme?.dollarSign, '$')
        const bin = colorize(this.config?.theme?.bin, this.config.bin)

        const command = colorize(this.config?.theme?.command, '<%= command.id %>')

        const commandDescription = colorize(
          this.config?.theme?.sectionDescription,
          u
            .replace('<%= command.id %>', '')
            .replace(new RegExp(`^${standardId}`), '')
            .replace(new RegExp(`^${configuredId}`), '')
            .trim(),
        )

        const line = `${dollarSign} ${bin} ${command} ${commandDescription}`.trim()
        if (line.length > allowedSpacing) {
          const splitIndex = line.slice(0, Math.max(0, allowedSpacing)).lastIndexOf(' ')
          return (
            line.slice(0, Math.max(0, splitIndex)) +
            '\n' +
            this.indent(this.wrap(line.slice(Math.max(0, splitIndex)), this.indentSpacing * 2))
          )
        }

        return this.wrap(line)
      })
      .join('\n')
    return body
  }

  private formatIfCommand(example: string): string {
    example = this.render(example)
    const dollarSign = colorize(this.config?.theme?.dollarSign, '$')
    if (example.startsWith(this.config.bin)) return `${dollarSign} ${example}`
    if (example.startsWith(`$ ${this.config.bin}`)) return `${dollarSign}${example.replace(`$`, '')}`
    return example
  }

  private isCommand(example: string): boolean {
    return ansis
      .strip(this.formatIfCommand(example))
      .startsWith(`${colorize(this.config?.theme?.dollarSign, '$')} ${this.config.bin}`)
  }
}
export default CommandHelp
