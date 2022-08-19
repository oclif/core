import {OptionFlag, Definition, BooleanFlag, EnumFlagOptions, Default} from './interfaces'
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

export function _enum<T = string>(opts: EnumFlagOptions<T> & {multiple: true} & ({required: true} | { default: Default<T[]> })): OptionFlag<T[]>
export function _enum<T = string>(opts: EnumFlagOptions<T> & {multiple: true}): OptionFlag<T[] | undefined>
export function _enum<T = string>(opts: EnumFlagOptions<T> & ({required: true} | { default: Default<T> })): OptionFlag<T>
export function _enum<T = string>(opts: EnumFlagOptions<T>): OptionFlag<T | undefined>
export function _enum<T = string>(opts: EnumFlagOptions<T>): OptionFlag<T> | OptionFlag<T[]> | OptionFlag<T | undefined> | OptionFlag<T[] | undefined> {
  return build<T>({
    async parse(input) {
      if (!opts.options.includes(input)) throw new Error(`Expected --${this.name}=${input} to be one of: ${opts.options.join(', ')}`)
      return input as unknown as T
    },
    helpValue: `(${opts.options.join('|')})`,
    ...opts,
  })()
}

export {_enum as enum}

const stringFlag = build({})
export {stringFlag as string}
export {boolean, integer, url, directory, file} from './parser'

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
