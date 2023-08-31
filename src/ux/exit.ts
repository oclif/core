export class ExitError extends Error {
  public ux: {
    exit: number;
  }

  public code: 'EEXIT'

  public error?: Error

  constructor(status: number, error?: Error) {
    const code = 'EEXIT'
    super(error ? error.message : `${code}: ${status}`)
    this.error = error
    this.ux = {exit: status}
    this.code = code
  }
}
