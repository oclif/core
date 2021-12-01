import {OptionFlag, Definition, BooleanFlag, EnumFlagOptions} from './interfaces'
import * as Parser from './parser'
import Command from './command'

export function build<T>(defaults: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>): Definition<T>
export function build(defaults: Partial<OptionFlag<string>>): Definition<string>
export function build<T>(defaults: Partial<OptionFlag<T>>): Definition<T> {
  return Parser.flags.build<T>(defaults as any)
}

export function option<T>(options: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>) {
  return build<T>(options)()
}

const _enum = <T = string>(opts: EnumFlagOptions<T>): OptionFlag<T> => {
  return build<T>({
    async parse(input) {
      if (!opts.options.includes(input)) throw new Error(`Expected --${this.name}=${input} to be one of: ${opts.options.join(', ')}`)
      return input as unknown as T
    },
    helpValue: `(${opts.options.join('|')})`,
    ...opts,
  })() as OptionFlag<T>
}

export {_enum as enum}

const stringFlag = build({})
export {stringFlag as string}
export {boolean, integer, url} from './parser'

export const version = (opts: Partial<BooleanFlag<boolean>> = {}) => {
  return Parser.flags.boolean({
    description: 'Show CLI version.',
    ...opts,
    parse: async (_: any, cmd: Command) => {
      cmd.log(cmd.config.userAgent)
      cmd.exit(0)
    },
  })
}

export const help = (opts: Partial<BooleanFlag<boolean>> = {}) => {
  return Parser.flags.boolean({
    description: 'Show CLI help.',
    ...opts,
    parse: async (_: any, cmd: Command) => {
      (cmd as any)._help()
    },
  })
}

export const table = () => {
  return {
    columns: Parser.flags.string({exclusive: ['extended'], description: 'Only show provided columns (comma-separated).'}),
    sort: Parser.flags.string({description: 'Property to sort by (prepend \'-\' for descending).'}),
    filter: Parser.flags.string({description: 'Filter property by partial string matching, ex: name=foo.'}),
    csv: Parser.flags.boolean({exclusive: ['no-truncate'], description: 'Output is csv format [alias: --output=csv].'}),
    output: Parser.flags.string({
      exclusive: ['no-truncate', 'csv'],
      description: 'Output in a more machine friendly format.',
      options: ['csv', 'json', 'yaml'],
    }),
    extended: Parser.flags.boolean({exclusive: ['columns'], char: 'x', description: 'Show extra columns.'}),
    'no-truncate': Parser.flags.boolean({exclusive: ['csv'], description: 'Do not truncate output to fit screen.'}),
    'no-header': Parser.flags.boolean({exclusive: ['csv'], description: 'Hide table header from output.'}),
  }
}
