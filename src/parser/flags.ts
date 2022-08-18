// tslint:disable interface-over-type-literal

import {URL} from 'url'

import {Definition, OptionFlag, BooleanFlag, Default} from '../interfaces'
import * as fs from 'fs'

export function build<T>(
  defaults: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>,
): Definition<T>
export function build(
  defaults: Partial<OptionFlag<string>>,
): Definition<string>
export function build<T>(defaults: Partial<OptionFlag<T>>): Definition<T> {
  return (options: any = {}) => {
    return {
      parse: async (i: string, _: any) => i,
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

export function integer(opts: Partial<OptionFlag<number>> & {min?: number; max?: number } & {multiple: true} & ({required: true} | { default: Default<number> })): OptionFlag<number[]>
export function integer(opts: Partial<OptionFlag<number>> & {min?: number; max?: number } & {multiple: true}): OptionFlag<number[] | undefined>
export function integer(opts: Partial<OptionFlag<number>> & {min?: number; max?: number } & ({required: true} | { default: Default<number> })): OptionFlag<number>
export function integer(opts?: Partial<OptionFlag<number>> & {min?: number; max?: number }): OptionFlag<number | undefined>
export function integer(opts: Partial<OptionFlag<number>> & {min?: number; max?: number } = {}): OptionFlag<number> | OptionFlag<number[]> | OptionFlag<number | undefined> | OptionFlag<number[] | undefined> {
  return build({
    ...opts,
    parse: async input => {
      if (!/^-?\d+$/.test(input))
        throw new Error(`Expected an integer but received: ${input}`)
      const num = Number.parseInt(input, 10)
      if (opts.min !== undefined && num < opts.min)
        throw new Error(`Expected an integer greater than or equal to ${opts.min} but received: ${input}`)
      if (opts.max !== undefined && num > opts.max)
        throw new Error(`Expected an integer less than or equal to ${opts.max} but received: ${input}`)
      return opts.parse ? opts.parse(input, 1) : num
    },
  })()
}

export function directory(opts: Partial<OptionFlag<string>> & { exists?: boolean } & {multiple: true} & ({required: true} | { default: Default<string> })): OptionFlag<string[]>
export function directory(opts: Partial<OptionFlag<string>> & { exists?: boolean } & {multiple: true}): OptionFlag<string[] | undefined>
export function directory(opts: { exists?: boolean } & Partial<OptionFlag<string>> & ({required: true} | { default: Default<string> })): OptionFlag<string>
export function directory(opts?: { exists?: boolean } & Partial<OptionFlag<string>>): OptionFlag<string | undefined>
export function directory(opts: { exists?: boolean } & Partial<OptionFlag<string>> = {}): OptionFlag<string> | OptionFlag<string[]> | OptionFlag<string | undefined> | OptionFlag<string[] | undefined> {
  return build<string>({
    ...opts,
    parse: async (input: string) => {
      if (opts.exists) {
        // 2nd "context" arg is required but unused
        return opts.parse ? opts.parse(await dirExists(input), true) : dirExists(input)
      }

      return opts.parse ? opts.parse(input, true) : input
    },
  })()
}

export function file(opts: Partial<OptionFlag<string>> & { exists?: boolean } & {multiple: true} & ({required: true} | { default: Default<string> })): OptionFlag<string[]>
export function file(opts: Partial<OptionFlag<string>> & { exists?: boolean } & {multiple: true}): OptionFlag<string[] | undefined>
export function file(opts: { exists?: boolean } & Partial<OptionFlag<string>> & ({required: true} | { default: Default<string> })): OptionFlag<string>
export function file(opts?: { exists?: boolean } & Partial<OptionFlag<string>>): OptionFlag<string | undefined>
export function file(opts: { exists?: boolean } & Partial<OptionFlag<string>> = {}): OptionFlag<string> | OptionFlag<string[]> | OptionFlag<string | undefined> | OptionFlag<string[] | undefined> {
  return build<string>({
    ...opts,
    parse: async (input: string) => {
      if (opts.exists) {
        // 2nd "context" arg is required but unused
        return opts.parse ? opts.parse(await fileExists(input), true) : fileExists(input)
      }

      return opts.parse ? opts.parse(input, true) : input
    },
  })()
}

/**
 * Initializes a string as a URL. Throws an error
 * if the string is not a valid URL.
 */
export const url = build({
  parse: async input => {
    try {
      return new URL(input)
    } catch {
      throw new Error(`Expected a valid url but received: ${input}`)
    }
  },
})

export function option<T>(
  options: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>,
) {
  return build<T>(options)()
}

const stringFlag = build({})
export {stringFlag as string}

export const defaultFlags = {
  color: boolean({allowNo: true}),
}

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
