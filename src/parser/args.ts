import {ParserArg, Arg, ParseFn} from '../interfaces'

export function newArg<T>(arg: Arg & { Parse: ParseFn<T> }): ParserArg<T>
export function newArg(arg: Arg): ParserArg<string>
export function newArg(arg: Arg<any>): any {
  return {
    parse: (i: string) => i,
    ...arg,
    required: Boolean(arg.required),
  }
}
