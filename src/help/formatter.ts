import ansis from 'ansis'
import indent from 'indent-string'
import width from 'string-width'
import widestLine from 'widest-line'
import wrap from 'wrap-ansi'

import {Command} from '../command'
import * as Interfaces from '../interfaces'
import {stdtermwidth} from '../screen'
import {colorize} from '../ux/theme'
import {template} from './util'

export type HelpSectionKeyValueTable = {description: string; name: string}[]
export type HelpSection =
  | {body: [string, string | undefined][] | HelpSectionKeyValueTable | string | undefined; header: string}
  | undefined
export type HelpSectionRenderer = (
  data: {args: Command.Arg.Any[]; cmd: Command.Loadable; flags: Command.Flag.Any[]},
  header: string,
) => HelpSection | HelpSection[] | string | undefined

export class HelpFormatter {
  protected config: Interfaces.Config

  indentSpacing = 2

  protected opts: Interfaces.HelpOptions

  /**
   * Takes a string and replaces `<%= prop =>` with the value of prop, where prop is anything on
   * `config=Interfaces.Config` or `opts=Interface.HelpOptions`.
   *
   * ```javascript
   * `<%= config.bin =>` // will resolve to the bin defined in `pjson.oclif`.
   * ```
   */
  render: (input: string) => string

  constructor(config: Interfaces.Config, opts: Partial<Interfaces.HelpOptions> = {}) {
    this.config = config
    this.opts = {maxWidth: stdtermwidth, ...opts}
    this.render = template(this)
  }

  /**
   * Indent by `this.indentSpacing`. The text should be wrap based on terminal width before indented.
   *
   * In order to call indent multiple times on the same set or text, the caller must wrap based on
   * the number of times the text has been indented. For example.
   *
   * ```javascript
   * const body = `main line\n${indent(wrap('indented example line', 4))}`
   * const header = 'SECTION'
   * console.log(`${header}\n${indent(wrap(body))}`
   * ```
   * will output
   * ```
   * SECTION
   *   main line
   *     indented example line
   * ```
   *
   * If the terminal width was 24 and the `4` was not provided in the first wrap, it would like like the following.
   * ```
   * SECTION
   *   main line
   *     indented example
   *   line
   * ```
   * @param body the text to indent
   * @param spacing the final number of spaces this text will be indented
   * @return the formatted indented text
   */
  public indent(body: string, spacing = this.indentSpacing): string {
    return indent(body, spacing)
  }

  public renderList(
    input: (string | undefined)[][],
    opts: {
      indentation: number
      multiline?: boolean | undefined
      spacer?: string | undefined
      stripAnsi?: boolean | undefined
    },
  ): string {
    if (input.length === 0) {
      return ''
    }

    const renderMultiline = () => {
      let output = ''
      for (let [left, right] of input) {
        if (!left && !right) continue
        if (left) {
          if (opts.stripAnsi) left = ansis.strip(left)
          output += this.wrap(left.trim(), opts.indentation)
        }

        if (right) {
          if (opts.stripAnsi) right = ansis.strip(right)
          output += '\n'
          output += this.indent(this.wrap(right.trim(), opts.indentation + 2), 4)
        }

        output += '\n\n'
      }

      return output.trim()
    }

    if (opts.multiline) return renderMultiline()
    const maxLength = widestLine(input.map((i) => i[0]).join('\n'))
    let output = ''
    let spacer = opts.spacer || '\n'
    let cur = ''
    for (const [left, r] of input) {
      let right = r
      if (cur) {
        output += spacer
        output += cur
      }

      cur = left || ''
      if (opts.stripAnsi) cur = ansis.strip(cur)
      if (!right) {
        cur = cur.trim()
        continue
      }

      if (opts.stripAnsi) right = ansis.strip(right)
      right = this.wrap(right.trim(), opts.indentation + maxLength + 2)

      const [first, ...lines] = right!.split('\n').map((s) => s.trim())
      cur += ' '.repeat(maxLength - width(cur) + 2)
      cur += first
      if (lines.length === 0) {
        continue
      }

      // if we start putting too many lines down, render in multiline format
      if (lines.length > 4) return renderMultiline()
      // if spacer is not defined, separate all rows with a newline
      if (!opts.spacer) spacer = '\n'
      cur += '\n'
      cur += this.indent(lines.join('\n'), maxLength + 2)
    }

    if (cur) {
      output += spacer
      output += cur
    }

    return output.trim()
  }

  public section(
    header: string,
    body: [string, string | undefined][] | HelpSection | HelpSectionKeyValueTable | string,
  ): string {
    // Always render template strings with the provided render function before wrapping and indenting
    let newBody: any
    if (typeof body! === 'string') {
      newBody = this.render(body!)
    } else if (Array.isArray(body)) {
      newBody = (body! as [string, HelpSectionKeyValueTable | string | undefined][]).map((entry) => {
        if ('name' in entry) {
          const tableEntry = entry as unknown as {description: string; name: string}
          return [this.render(tableEntry.name), this.render(tableEntry.description)]
        }

        const [left, right] = entry
        return [this.render(left), right && this.render(right as string)]
      })
    } else if ('header' in body!) {
      return this.section(body!.header, body!.body)
    } else {
      newBody = (body! as unknown as HelpSectionKeyValueTable)
        .map((entry: {description: string; name: string}) => [entry.name, entry.description])
        .map(([left, right]) => [this.render(left), right && this.render(right)])
    }

    const output = [
      colorize(this.config?.theme?.sectionHeader, ansis.bold(header)),
      colorize(
        this.config?.theme?.sectionDescription,
        this.indent(
          Array.isArray(newBody) ? this.renderList(newBody, {indentation: 2, stripAnsi: this.opts.stripAnsi}) : newBody,
        ),
      ),
    ].join('\n')

    return this.opts.stripAnsi ? ansis.strip(output) : output
  }

  /**
   * Wrap text according to `opts.maxWidth` which is typically set to the terminal width. All text
   * will be rendered before bring wrapped, otherwise it could mess up the lengths.
   *
   * A terminal will automatically wrap text, so this method is primarily used for indented
   * text. For indented text, specify the indentation so it is taken into account during wrapping.
   *
   * Here is an example of wrapping with indentation.
   * ```
   * <------ terminal window width ------>
   * <---------- no indentation --------->
   * This is my text that will be wrapped
   * once it passes maxWidth.
   *
   * <- indent -><------ text space ----->
   *             This is my text that will
   *             be wrapped once it passes
   *             maxWidth.
   *
   * <-- indent not taken into account ->
   *             This is my text that will
   * be wrapped
   *             once it passes maxWidth.
   * ```
   * @param body the text to wrap
   * @param spacing the indentation size to subtract from the terminal width
   * @returns the formatted wrapped text
   */
  public wrap(body: string, spacing = this.indentSpacing): string {
    return wrap(this.render(body), this.opts.maxWidth - spacing, {hard: true})
  }
}
