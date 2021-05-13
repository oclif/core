import {CLIError} from './cli'
import {OclifError} from '../../interfaces'

export class ModuleLoadError extends CLIError implements OclifError {
  oclif!: { exit: number }

  code = 'MODULE_NOT_FOUND'

  constructor(message: string) {
    super(`[MODULE_NOT_FOUND] ${message}`, {exit: 1})
    this.name = 'ModuleLoadError'
  }
}
