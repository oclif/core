import {URL} from 'url'

import {Definition, OptionFlag, BooleanFlag} from '../interfaces'
import * as fs from 'fs'
import {FlagParser, CustomOptionFlag} from '../interfaces/parser'

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
  defaults: {parse: FlagParser<T, string, P>, multiple: true} & Partial<CustomOptionFlag<T, P, true>>,
): Definition<T, P>
export function custom<T, P = Record<string, unknown>>(
  defaults: {parse: FlagParser<T, string, P>} & Partial<CustomOptionFlag<T, P>>,
): Definition<T, P>
export function custom<T = string, P = Record<string, unknown>>(defaults: Partial<CustomOptionFlag<T, P>>): Definition<T, P>
export function custom<T, P = Record<string, unknown>>(defaults: Partial<CustomOptionFlag<T, P>>): Definition<T, P> {
  return (options: any = {}) => {
    return {
      parse: async (i: string, _context: any, _opts: P) => i,
      ...defaults,
      ...options,
      input: [] as string[],
      multiple: Boolean(options.multiple === undefined ? defaults.multiple : options.multiple),
      type: 'option',
    }
  }
}

/**
 * @deprecated Use Flags.custom instead.
 */
export function build<T>(
  defaults: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>,
): Definition<T>
export function build(defaults: Partial<OptionFlag<string>>): Definition<string>
export function build<T>(defaults: Partial<OptionFlag<T>>): Definition<T> {
  return (options: any = {}) => {
    return {
      parse: async (i: string, _context: any) => i,
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
  parse: async (input, _, opts) => {
    if (opts.exists) return dirExists(input)

    return input
  },
})

export const file = custom<string, {exists?: boolean}>({
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
  parse: async input => {
    try {
      return new URL(input)
    } catch {
      throw new Error(`Expected a valid url but received: ${input}`)
    }
  },
})

const stringFlag = custom({})
export {stringFlag as string}

const dirExists = async (input: string): Promise<string> => {
  if (!fs.existsSync(input)) {
    throw new Error(`No directory found at ${input}`)
  }

  if (!(await fs.promises.stat(input)).isDirectory()) {
    throw new Error(`${input} exists but is not a directory`)
  }

  return input
}

const fileExists = async (input: string): Promise<string> => {
  if (!fs.existsSync(input)) {
    throw new Error(`No file found at ${input}`)
  }

  if (!(await fs.promises.stat(input)).isFile()) {
    throw new Error(`${input} exists but is not a file`)
  }

  return input
}
