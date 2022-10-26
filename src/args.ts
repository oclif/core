import {URL} from 'url'
import * as fs from 'fs'
import {OptionArg, ArgDefinition, BooleanArg, Default, ArgParser, EnumArgOptions} from './interfaces/parser'

/**
 * Create a custom arg.
 *
 * @example
 * type Id = string
 * type IdOpts = { startsWith: string; length: number };
 *
 * export const myArg = custom<Id, IdOpts>({
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
  defaults: {parse: ArgParser<T, P>, multiple: true} & Partial<OptionArg<T>>,
): ArgDefinition<T, P>
export function custom<T, P = Record<string, unknown>>(
  defaults: {parse: ArgParser<T, P>} & Partial<OptionArg<T>>,
): ArgDefinition<T, P>
export function custom<T = string, P = Record<string, unknown>>(defaults: Partial<OptionArg<T>>): ArgDefinition<T, P>
export function custom<T, P = Record<string, unknown>>(defaults: Partial<OptionArg<T>>): ArgDefinition<T, P> {
  return (options: any = {}) => {
    return {
      parse: async (i: string, _context: any, _opts: P) => i,
      ...defaults,
      ...options,
      input: [] as string[],
      type: 'option',
    }
  }
}

export function boolean<T = boolean>(
  options: Partial<BooleanArg<T>> = {},
): BooleanArg<T> {
  return {
    parse: async b => Boolean(b),
    ...options,
    type: 'boolean',
  } as BooleanArg<T>
}

export function _enum<T = string>(opts: EnumArgOptions<T> & {multiple: true} & ({required: true} | { default: Default<T[]> })): OptionArg<T[]>
export function _enum<T = string>(opts: EnumArgOptions<T> & {multiple: true}): OptionArg<T[] | undefined>
export function _enum<T = string>(opts: EnumArgOptions<T> & ({required: true} | { default: Default<T> })): OptionArg<T>
export function _enum<T = string>(opts: EnumArgOptions<T>): OptionArg<T | undefined>
export function _enum<T = string>(opts: EnumArgOptions<T>): OptionArg<T> | OptionArg<T[]> | OptionArg<T | undefined> | OptionArg<T[] | undefined> {
  return custom<T, EnumArgOptions<T>>({
    async parse(input) {
      if (!opts.options.includes(input)) throw new Error(`Expected --${this.name}=${input} to be one of: ${opts.options.join(', ')}`)
      return input as unknown as T
    },
    ...opts,
  })()
}

export {_enum as enum}

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
