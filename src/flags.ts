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
