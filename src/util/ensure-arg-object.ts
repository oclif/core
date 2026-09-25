import {type Command} from '../command'
import {type ArgInput} from '../interfaces/parser'

/**
 * Ensure that the provided args are an object. This is for backwards compatibility with v1 commands which
 * defined args as an array.
 *
 * @param args Either an array of args or an object of args
 * @returns ArgInput
 */
export function ensureArgObject(args?: Record<string, Command.Arg.Cached> | ArgInput | any[]): ArgInput {
  return (
    Array.isArray(args) ? (args ?? []).reduce<ArgInput>((x, y) => ({...x, [y.name]: y}), {}) : (args ?? {})
  ) as ArgInput
}
