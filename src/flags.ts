/* eslint-disable valid-jsdoc */
import {BooleanFlag, CustomOptions, FlagDefinition, OptionFlag} from './interfaces'
import {dirExists, fileExists} from './util/index'
import {CLIError} from './errors'
import {URL} from 'node:url'
import {loadHelpClass} from './help'

type NotArray<T> = T extends Array<any> ? never : T

export function custom<T = string, P extends CustomOptions = CustomOptions>(
  defaults: Partial<OptionFlag<T[], P>> & {
    multiple: true
  } & ({required: true} | {default: OptionFlag<T[], P>['default']}),
): FlagDefinition<T, P, {multiple: true; requiredOrDefaulted: true}>

export function custom<T = string, P extends CustomOptions = CustomOptions>(
  defaults: Partial<OptionFlag<NotArray<T>, P>> & {
    multiple?: false | undefined
  } & ({required: true} | {default: OptionFlag<NotArray<T>, P>['default']}),
): FlagDefinition<T, P, {multiple: false; requiredOrDefaulted: true}>

export function custom<T = string, P extends CustomOptions = CustomOptions>(
  defaults: Partial<OptionFlag<NotArray<T>, P>> & {
    default?: OptionFlag<NotArray<T>, P>['default'] | undefined
    multiple?: false | undefined
    required?: false | undefined
  },
): FlagDefinition<T, P, {multiple: false; requiredOrDefaulted: false}>

export function custom<T = string, P extends CustomOptions = CustomOptions>(
  defaults: Partial<OptionFlag<T[], P>> & {
    multiple: true
    default?: OptionFlag<T[], P>['default'] | undefined
    required?: false | undefined
  },
): FlagDefinition<T, P, {multiple: true; requiredOrDefaulted: false}>

export function custom<T = string, P extends CustomOptions = CustomOptions>(): FlagDefinition<
  T,
  P,
  {multiple: false; requiredOrDefaulted: false}
>
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
export function custom<T = string, P extends CustomOptions = CustomOptions>(
  defaults?: Partial<OptionFlag<T, P>>,
): FlagDefinition<T, P, {multiple: boolean; requiredOrDefaulted: boolean}> {
  return (options: any = {}) => ({
    parse: async (input, _ctx, _opts) => input,
    ...defaults,
    ...options,
    input: [] as string[],
    multiple: Boolean(options.multiple === undefined ? defaults?.multiple ?? false : options.multiple),
    type: 'option',
  })
}

export function boolean<T = boolean>(options: Partial<BooleanFlag<T>> = {}): BooleanFlag<T> {
  return {
    parse: async (b, _) => b,
    ...options,
    allowNo: Boolean(options.allowNo),
    type: 'boolean',
  } as BooleanFlag<T>
}

export const integer = custom<number, {min?: number; max?: number}>({
  async parse(input, _, opts) {
    if (!/^-?\d+$/.test(input)) throw new CLIError(`Expected an integer but received: ${input}`)
    const num = Number.parseInt(input, 10)
    if (opts.min !== undefined && num < opts.min)
      throw new CLIError(`Expected an integer greater than or equal to ${opts.min} but received: ${input}`)
    if (opts.max !== undefined && num > opts.max)
      throw new CLIError(`Expected an integer less than or equal to ${opts.max} but received: ${input}`)
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
      throw new CLIError(`Expected a valid url but received: ${input}`)
    }
  },
})

export const string = custom()

export const version = (opts: Partial<BooleanFlag<boolean>> = {}): BooleanFlag<void> =>
  boolean({
    description: 'Show CLI version.',
    ...opts,
    async parse(_, ctx) {
      ctx.log(ctx.config.userAgent)
      ctx.exit(0)
    },
  })

export const help = (opts: Partial<BooleanFlag<boolean>> = {}): BooleanFlag<void> =>
  boolean({
    description: 'Show CLI help.',
    ...opts,
    async parse(_, cmd) {
      const Help = await loadHelpClass(cmd.config)
      await new Help(cmd.config, cmd.config.pjson.helpOptions).showHelp(cmd.id ? [cmd.id, ...cmd.argv] : cmd.argv)
      cmd.exit(0)
    },
  })

type ElementType<T extends ReadonlyArray<unknown>> = T[number]

export function option<T extends readonly string[], P extends CustomOptions>(
  defaults: Partial<OptionFlag<ElementType<T>[], P>> & {
    options: T
    multiple: true
  } & (
      | {required: true}
      | {
          default: OptionFlag<ElementType<T>[], P>['default'] | undefined
        }
    ),
): FlagDefinition<(typeof defaults.options)[number], P, {multiple: true; requiredOrDefaulted: true}>

export function option<T extends readonly string[], P extends CustomOptions>(
  defaults: Partial<OptionFlag<ElementType<T>, P>> & {
    options: T
    multiple?: false | undefined
  } & ({required: true} | {default: OptionFlag<ElementType<T>, P>['default']}),
): FlagDefinition<(typeof defaults.options)[number], P, {multiple: false; requiredOrDefaulted: true}>

export function option<T extends readonly string[], P extends CustomOptions>(
  defaults: Partial<OptionFlag<ElementType<T>, P>> & {
    options: T
    default?: OptionFlag<ElementType<T>, P>['default'] | undefined
    multiple?: false | undefined
    required?: false | undefined
  },
): FlagDefinition<(typeof defaults.options)[number], P, {multiple: false; requiredOrDefaulted: false}>

export function option<T extends readonly string[], P extends CustomOptions>(
  defaults: Partial<OptionFlag<ElementType<T>[], P>> & {
    options: T
    multiple: true
    default?: OptionFlag<ElementType<T>[], P>['default'] | undefined
    required?: false | undefined
  },
): FlagDefinition<(typeof defaults.options)[number], P, {multiple: true; requiredOrDefaulted: false}>

/**
 * Create a custom flag that infers the flag type from the provided options.
 *
 * @example
 * export default class MyCommand extends Command {
 *   static flags = {
 *     name: Flags.option({
 *       options: ['foo', 'bar'] as const,
 *     })(),
 *   }
 * }
 */
export function option<T extends readonly string[], P extends CustomOptions>(
  defaults: Partial<OptionFlag<ElementType<T>, P>> & {options: T},
): FlagDefinition<(typeof defaults.options)[number], P, {multiple: boolean; requiredOrDefaulted: boolean}> {
  return (options: any = {}) => ({
    parse: async (input, _ctx, _opts) => input,
    ...defaults,
    ...options,
    input: [] as string[],
    multiple: Boolean(options.multiple === undefined ? defaults.multiple : options.multiple),
    type: 'option',
  })
}
