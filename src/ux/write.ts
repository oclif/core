import {format} from 'node:util'

export const stdout = (str: string | string[] | undefined, ...args: string[]): void => {
  if (typeof str === 'string' || !str) {
    process.stdout.write(format(str, ...args) + '\n')
  } else {
    process.stdout.write(format(...str, ...args) + '\n')
  }
}

export const stderr = (str: string | string[] | undefined, ...args: string[]): void => {
  if (typeof str === 'string' || !str) {
    process.stderr.write(format(str, ...args) + '\n')
  } else {
    process.stderr.write(format(...str, ...args) + '\n')
  }
}
