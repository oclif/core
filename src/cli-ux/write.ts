const stdout = (msg: string): void => {
  process.stdout.write(msg)
}

const stderr = (msg: string): void => {
  process.stderr.write(msg)
}

export default {
  stderr,
  stdout,
}
