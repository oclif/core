import {IConfig} from '@oclif/config'
import * as Parser from '@oclif/parser'

import {Command} from '.'

export type ICompletionContext = {
  args?: { [name: string]: string };
  flags?: { [name: string]: string };
  argv?: string[];
  config: IConfig;
}

export type ICompletion = {
  skipCache?: boolean;
  cacheDuration?: number;
  cacheKey?(ctx: ICompletionContext): Promise<string>;
  options(ctx: ICompletionContext): Promise<string[]>;
}

export type IOptionFlag<T> = Parser.flags.IOptionFlag<T> & {
  completion?: ICompletion;
}

export type IFlag<T> = Parser.flags.IBooleanFlag<T> | IOptionFlag<T>

export type Output = Parser.flags.Output
export type Input<T extends Output> = { [P in keyof T]: IFlag<T[P]> }

export type Definition<T> = {
  (options: {multiple: true} & Partial<IOptionFlag<T[]>>): IOptionFlag<T[]>;
  (options: ({required: true} | {default: Parser.flags.Default<T>}) & Partial<IOptionFlag<T>>): IOptionFlag<T>;
  (options?: Partial<IOptionFlag<T>>): IOptionFlag<T | undefined>;
}

export function build<T>(defaults: {parse: IOptionFlag<T>['parse']} & Partial<IOptionFlag<T>>): Definition<T>
export function build(defaults: Partial<IOptionFlag<string>>): Definition<string>
export function build<T>(defaults: Partial<IOptionFlag<T>>): Definition<T> {
  return Parser.flags.build<T>(defaults as any)
}

export function option<T>(options: {parse: IOptionFlag<T>['parse']} & Partial<IOptionFlag<T>>) {
  return build<T>(options)()
}

const _enum = <T = string>(opts: Parser.flags.EnumFlagOptions<T>): IOptionFlag<T> => {
  return build<T>({
    parse(input) {
      if (!opts.options.includes(input)) throw new Error(`Expected --${this.name}=${input} to be one of: ${opts.options.join(', ')}`)
      return input as unknown as T
    },
    helpValue: `(${opts.options.join('|')})`,
    ...opts,
  })() as IOptionFlag<T>
}
export {_enum as enum}

const stringFlag = build({})
export {stringFlag as string}
export {boolean, integer} from '@oclif/parser/lib/flags'

export const version = (opts: Partial<Parser.flags.IBooleanFlag<boolean>> = {}) => {
  return Parser.flags.boolean({
    // char: 'v',
    description: 'show CLI version',
    ...opts,
    parse: (_: any, cmd: Command) => {
      cmd.log(cmd.config.userAgent)
      cmd.exit(0)
    },
  })
}

export const help = (opts: Partial<Parser.flags.IBooleanFlag<boolean>> = {}) => {
  return Parser.flags.boolean({
    // char: 'h',
    description: 'show CLI help',
    ...opts,
    parse: (_: any, cmd: Command) => {
      (cmd as any)._help()
    },
  })
}
