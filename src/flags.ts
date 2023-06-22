import {URL} from 'url'
import {Help} from './help'
import {BooleanFlag} from './interfaces'
import {FlagDefinition, OptionFlagDefaults, FlagParser} from './interfaces/parser'
import {dirExists, fileExists} from './util'

/**
 * Create a custom flag.
 *
 * @example
 * type Id = string
 * type IdOpts = { startsWith: string; length: number };
 *
 * export const myFlag = custom<Id, IdOpts>({
 *   parse: async (input, opts) => {
 *     if (input.startsWith(opts.startsWith) && input.length === opts.length) {
 *       return input
 *     }
 *
 *     throw new Error('Invalid id')
 *   },
 * })
 */
export function custom<T, P = Record<string, unknown>>(
    defaults: {parse: FlagParser<T, string, P>, multiple: true} & Partial<OptionFlagDefaults<T, P, true>>,
): FlagDefinition<T, P>
export function custom<T, P = Record<string, unknown>>(
  defaults: {parse: FlagParser<T, string, P>} & Partial<OptionFlagDefaults<T, P>>,
): FlagDefinition<T, P>
export function custom<T = string, P = Record<string, unknown>>(defaults: Partial<OptionFlagDefaults<T, P>>): FlagDefinition<T, P>
export function custom<T, P = Record<string, unknown>>(defaults: Partial<OptionFlagDefaults<T, P>>): FlagDefinition<T, P> {
  return (options: any = {}) => {
    return {
      parse: async (input, _ctx, _opts) => input,
      ...defaults,
      ...options,
      input: [] as string[],
      multiple: Boolean(options.multiple === undefined ? defaults.multiple : options.multiple),
      type: 'option',
    }
  }
}

export function boolean<T = boolean>(
  options: Partial<BooleanFlag<T>> = {},
): BooleanFlag<T> {
  return {
    parse: async (b, _) => b,
    ...options,
    allowNo: Boolean(options.allowNo),
    type: 'boolean',
  } as BooleanFlag<T>
}

export const integer = custom<number, {min?: number; max?: number;}>({
  subType: 'integer',
  parse: async (input, _, opts) => {
    if (!/^-?\d+$/.test(input))
      throw new Error(`Expected an integer but received: ${input}`)
    const num = Number.parseInt(input, 10)
    if (opts.min !== undefined && num < opts.min)
      throw new Error(`Expected an integer greater than or equal to ${opts.min} but received: ${input}`)
    if (opts.max !== undefined && num > opts.max)
      throw new Error(`Expected an integer less than or equal to ${opts.max} but received: ${input}`)
    return num
  },
})

export const directory = custom<string, {exists?: boolean}>({
  subType: 'directory',
  parse: async (input, _, opts) => {
    if (opts.exists) return dirExists(input)

    return input
  },
})

export const file = custom<string, {exists?: boolean}>({
  subType: 'file',
  parse: async (input, _, opts) => {
    if (opts.exists) return fileExists(input)

    return input
  },
})

/**
 * Initializes a string as a URL. Throws an error
 * if the string is not a valid URL.
 */
export const url = custom<URL>({
  subType: 'url',
  parse: async input => {
    try {
      return new URL(input)
    } catch {
      throw new Error(`Expected a valid url but received: ${input}`)
    }
  },
})

const stringFlag = custom({subType: 'string'})
export {stringFlag as string}

export const version = (opts: Partial<BooleanFlag<boolean>> = {}): BooleanFlag<void> => {
  return boolean({
    description: 'Show CLI version.',
    ...opts,
    parse: async (_: any, ctx) => {
      ctx.log(ctx.config.userAgent)
      ctx.exit(0)
    },
  })
}

export const help = (opts: Partial<BooleanFlag<boolean>> = {}): BooleanFlag<void> => {
  return boolean({
    description: 'Show CLI help.',
    ...opts,
    parse: async (_, cmd) => {
      new Help(cmd.config).showHelp(cmd.id ? [cmd.id, ...cmd.argv] : cmd.argv)
      cmd.exit(0)
    },
  })
}
