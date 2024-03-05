const stdout = (msg: string): void => {
  process.stdout.write(msg)
}

const stderr = (msg: string): void => {
  process.stderr.write(msg)
}

/**
 * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
 */
export default {
  stderr,
  stdout,
}
