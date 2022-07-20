// tslint:disable interface-over-type-literal

import {URL} from 'url'

import {Definition, OptionFlag, BooleanFlag} from '../interfaces'
import * as fs from 'fs'

export function build<T>(
  defaults: {parse: OptionFlag<T>['parse']} & Partial<OptionFlag<T>>,
): Definition<T>
export function build(
  defaults: Partial<OptionFlag<string>>,
): Definition<string>
export function build<T>(defaults: Partial<OptionFlag<T>>): Definition<T> {
  return (options: any = {}): any => {
    return {
      parse: async (i: string, _: any) => i,
      ...defaults,
      ...options,
      input: [] as string[],
      multiple: Boolean(options.multiple === undefined ? defaults.multiple : options.multiple),
      type: 'option',
    } as any
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

export const integer = (opts: { min?: number; max?: number } & Partial<OptionFlag<number>> = {}): OptionFlag<number | undefined> => {
  return build<number>({
    ...opts,
    parse: async input => {
      if (!/^-?\d+$/.test(input))
        throw new Error(`Expected an integer but received: ${input}`)
      const num = Number.parseInt(input, 10)
      if (typeof opts.min === 'number' && Number(input) < opts.min)
        throw new Error(`Expected an integer greater than or equal to ${opts.min} but received: ${input}`)
      if (typeof opts.max === 'number' && Number(input) > opts.max)
        throw new Error(`Expected an integer less than or equal to ${opts.max} but received: ${input}`)
      return num
    },
  })()
}

export const directory = (opts: { exists?: boolean } & Partial<OptionFlag<string>> = {}): OptionFlag<string | undefined> => {
  return build<string>({
    ...opts,
    parse: async (input: string) => opts.exists ? dirExists(input) : input,
  })()
}

export const file = (opts: { exists?: boolean } & Partial<OptionFlag<string>> = {}): OptionFlag<string | undefined> => {
  return build<string>({
    ...opts,
    parse: async (input: string) => opts.exists ? fileExists(input) : input,
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
