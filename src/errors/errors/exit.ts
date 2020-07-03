import {CLIError, OclifError} from './cli'

export class ExitError extends CLIError implements OclifError {
  oclif!: { exit: number }

  code = 'EEXIT'

  constructor(exitCode = 0) {
    super(`EEXIT: ${exitCode}`, {exit: exitCode})
  }

  render(): string {
    return ''
  }
}
