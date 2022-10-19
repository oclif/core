import {OptionFlag, BooleanFlag, EnumFlagOptions, Default} from './interfaces'
import {custom, boolean} from './parser'
import Command from './command'
import {Help} from './help'
export {boolean, integer, url, directory, file, string, build, option, custom} from './parser'

export function _enum<T = string>(opts: EnumFlagOptions<T, true> & {multiple: true} & ({required: true} | { default: Default<T[]> })): OptionFlag<T[]>
export function _enum<T = string>(opts: EnumFlagOptions<T, true> & {multiple: true}): OptionFlag<T[] | undefined>
export function _enum<T = string>(opts: EnumFlagOptions<T> & ({required: true} | { default: Default<T> })): OptionFlag<T>
export function _enum<T = string>(opts: EnumFlagOptions<T>): OptionFlag<T | undefined>
export function _enum<T = string>(opts: EnumFlagOptions<T>): OptionFlag<T> | OptionFlag<T[]> | OptionFlag<T | undefined> | OptionFlag<T[] | undefined> {
  return custom<T, EnumFlagOptions<T>>({
    async parse(input) {
      if (!opts.options.includes(input)) throw new Error(`Expected --${this.name}=${input} to be one of: ${opts.options.join(', ')}`)
      return input as unknown as T
    },
    helpValue: `(${opts.options.join('|')})`,
    ...opts,
  })()
}

export {_enum as enum}

export const version = (opts: Partial<BooleanFlag<boolean>> = {}) => {
  return boolean({
    description: 'Show CLI version.',
    ...opts,
    parse: async (_: any, cmd: Command) => {
      cmd.log(cmd.config.userAgent)
      cmd.exit(0)
    },
  })
}

export const help = (opts: Partial<BooleanFlag<boolean>> = {}) => {
  return boolean({
    description: 'Show CLI help.',
    ...opts,
    parse: async (_: any, cmd: Command) => {
      new Help(cmd.config).showHelp(cmd.argv)
      cmd.exit(0)
    },
  })
}
