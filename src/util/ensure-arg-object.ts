import {ArgInput} from '../interfaces/parser'
import {Command} from '../command'

/**
 * Ensure that the provided args are an object. This is for backwards compatibility with v1 commands which
 * defined args as an array.
 *
 * @param args Either an array of args or an object of args
 * @returns ArgInput
 */
export function ensureArgObject(args?: any[] | ArgInput | {[name: string]: Command.Arg.Cached}): ArgInput {
  return (
    Array.isArray(args) ? (args ?? []).reduce((x, y) => ({...x, [y.name]: y}), {} as ArgInput) : args ?? {}
  ) as ArgInput
}
