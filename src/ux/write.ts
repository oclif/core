import {format} from 'node:util'
export const stdout = (str?: string | string[] | undefined, ...args: string[]): void => {
  if (!str && args) {
    console.log(format(...args))
  } else if (!str) {
    console.log()
  } else if (typeof str === 'string') {
    console.log(format(str, ...args))
  } else {
    console.log(format(...str, ...args))
  }
}

export const stderr = (str?: string | string[] | undefined, ...args: string[]): void => {
  if (!str && args) {
    console.error(format(...args))
  } else if (!str) {
    console.error()
  } else if (typeof str === 'string') {
    console.error(format(str, ...args))
  } else {
    console.error(format(...str, ...args))
  }
}
