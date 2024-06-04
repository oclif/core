import {ExitError} from './errors/exit'

export function exit(code = 0): never {
  throw new ExitError(code)
}
