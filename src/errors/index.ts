import {ExitError} from './errors/exit'

export {PrettyPrintableError} from '../interfaces'
export {config} from './config'
export {error} from './error'
export {CLIError} from './errors/cli'
export {ExitError} from './errors/exit'
export {ModuleLoadError} from './errors/module-load'
export {handle} from './handle'
export {Logger} from './logger'
export function exit(code = 0): never {
  throw new ExitError(code)
}

export {warn} from './warn'
