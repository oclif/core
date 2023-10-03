import {OclifError} from '../../interfaces'
import {CLIError} from './cli'

export class ModuleLoadError extends CLIError implements OclifError {
  code = 'MODULE_NOT_FOUND'

  constructor(message: string) {
    super(`[MODULE_NOT_FOUND] ${message}`, {exit: 1})
    this.name = 'ModuleLoadError'
  }
}
