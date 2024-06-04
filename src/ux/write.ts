import {format} from 'node:util'

export const stdout = (str?: string | string[] | undefined, ...args: string[]): void => {
  if (!str && args) {
    process.stdout.write(format(...args) + '\n')
  } else if (!str) {
    process.stdout.write('\n')
  } else if (typeof str === 'string') {
    process.stdout.write((str && format(str, ...args)) + '\n')
  } else {
    process.stdout.write(format(...str, ...args) + '\n')
  }
}

export const stderr = (str?: string | string[] | undefined, ...args: string[]): void => {
  if (!str && args) {
    process.stderr.write(format(...args) + '\n')
  } else if (!str) {
    process.stderr.write('\n')
  } else if (typeof str === 'string') {
    process.stderr.write((str && format(str, ...args)) + '\n')
  } else {
    process.stderr.write(format(...str, ...args) + '\n')
  }
}
