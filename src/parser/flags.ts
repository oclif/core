// tslint:disable interface-over-type-literal

import {Definition, OptionFlag, BooleanFlag} from '../interfaces'

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
      multiple: Boolean(options.multiple),
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

export const integer = build({
  parse: async input => {
    if (!/^-?\d+$/.test(input))
      throw new Error(`Expected an integer but received: ${input}`)
    return parseInt(input, 10)
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
