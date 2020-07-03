// tslint:disable interface-over-type-literal

import {AlphabetLowercase, AlphabetUppercase} from './alphabet'

export type DefaultContext<T> = {
  options: IOptionFlag<T>;
  flags: {[k: string]: string};
}

export type Default<T> = T | ((context: DefaultContext<T>) => T)

export type IFlagBase<T, I> = {
  name: string;
  char?: AlphabetLowercase | AlphabetUppercase;
  description?: string;
  helpLabel?: string;
  hidden?: boolean;
  required?: boolean;
  dependsOn?: string[];
  exclusive?: string[];
  exactlyOne?: string[];
  /**
   * also accept an environment variable as input
   */
  env?: string;
  parse(input: I, context: any): T;
}

export type IBooleanFlag<T> = IFlagBase<T, boolean> & {
  type: 'boolean';
  allowNo: boolean;
  /**
   * specifying a default of false is the same not specifying a default
   */
  default?: Default<boolean>;
}

export type IOptionFlag<T> = IFlagBase<T, string> & {
  type: 'option';
  helpValue?: string;
  default?: Default<T | undefined>;
  multiple: boolean;
  input: string[];
  options?: string[];
}

export type Definition<T> = {
  (options: {multiple: true} & Partial<IOptionFlag<T[]>>): IOptionFlag<T[]>;
  (
    options: ({required: true} | {default: Default<T>}) &
      Partial<IOptionFlag<T>>,
  ): IOptionFlag<T>;
  (options?: Partial<IOptionFlag<T>>): IOptionFlag<T | undefined>;
}

export type EnumFlagOptions<T> = Partial<IOptionFlag<T>> & {
  options: T[];
}

export type IFlag<T> = IBooleanFlag<T> | IOptionFlag<T>

export function build<T>(
  defaults: {parse: IOptionFlag<T>['parse']} & Partial<IOptionFlag<T>>,
): Definition<T>
export function build(
  defaults: Partial<IOptionFlag<string>>,
): Definition<string>
export function build<T>(defaults: Partial<IOptionFlag<T>>): Definition<T> {
  return (options: any = {}): any => {
    return {
      parse: (i: string, _: any) => i,
      ...defaults,
      ...options,
      input: [] as string[],
      multiple: Boolean(options.multiple),
      type: 'option',
    } as any
  }
}

export function boolean<T = boolean>(
  options: Partial<IBooleanFlag<T>> = {},
): IBooleanFlag<T> {
  return {
    parse: (b, _) => b,
    ...options,
    allowNo: Boolean(options.allowNo),
    type: 'boolean',
  } as IBooleanFlag<T>
}

export const integer = build({
  parse: input => {
    if (!/^-?\d+$/.test(input))
      throw new Error(`Expected an integer but received: ${input}`)
    return parseInt(input, 10)
  },
})

export function option<T>(
  options: {parse: IOptionFlag<T>['parse']} & Partial<IOptionFlag<T>>,
) {
  return build<T>(options)()
}

const stringFlag = build({})
export {stringFlag as string}

export const defaultFlags = {
  color: boolean({allowNo: true}),
}

export type Output = {[name: string]: any}
export type Input<T extends Output> = {[P in keyof T]: IFlag<T[P]>}
