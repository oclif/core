import {CLIError} from './cli'
import {OclifError} from '../../interfaces'

export class ExitError extends CLIError implements OclifError {
  oclif!: { exit: number }

  code = 'EEXIT'

  constructor(exitCode = 1) {
    super(`EEXIT: ${exitCode}`, {exit: exitCode})
  }

  render(): string {
    return ''
  }
}
