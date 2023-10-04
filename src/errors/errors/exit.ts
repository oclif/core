import {OclifError} from '../../interfaces'
import {CLIError} from './cli'

export class ExitError extends CLIError implements OclifError {
  code = 'EEXIT'

  constructor(exitCode = 1) {
    super(`EEXIT: ${exitCode}`, {exit: exitCode})
  }

  render(): string {
    return ''
  }
}
