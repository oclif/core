import {Arg, ArgDefinition} from './interfaces/parser'
import {dirExists, fileExists, isNotFalsy} from './util'
import {Command} from './command'
import {URL} from 'node:url'

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
export function custom<T = string, P = Record<string, unknown>>(defaults: Partial<Arg<T, P>>): ArgDefinition<T, P>
export function custom<T, P = Record<string, unknown>>(defaults: Partial<Arg<T, P>>): ArgDefinition<T, P> {
  return (options: any = {}) => ({
    parse: async (i: string, _context: Command, _opts: P) => i,
    ...defaults,
    ...options,
    input: [] as string[],
    type: 'option',
  })
}

export const boolean = custom<boolean>({
  parse: async (b) => Boolean(b) && isNotFalsy(b),
})

export const integer = custom<number, {min?: number; max?: number}>({
  async parse(input, _, opts) {
    if (!/^-?\d+$/.test(input)) throw new Error(`Expected an integer but received: ${input}`)
    const num = Number.parseInt(input, 10)
    if (opts.min !== undefined && num < opts.min)
      throw new Error(`Expected an integer greater than or equal to ${opts.min} but received: ${input}`)
    if (opts.max !== undefined && num > opts.max)
      throw new Error(`Expected an integer less than or equal to ${opts.max} but received: ${input}`)
    return num
  },
})

export const directory = custom<string, {exists?: boolean}>({
  async parse(input, _, opts) {
    if (opts.exists) return dirExists(input)

    return input
  },
})

export const file = custom<string, {exists?: boolean}>({
  async parse(input, _, opts) {
    if (opts.exists) return fileExists(input)

    return input
  },
})

/**
 * Initializes a string as a URL. Throws an error
 * if the string is not a valid URL.
 */
export const url = custom<URL>({
  async parse(input) {
    try {
      return new URL(input)
    } catch {
      throw new Error(`Expected a valid url but received: ${input}`)
    }
  },
})

const stringArg = custom({})
export {stringArg as string}
