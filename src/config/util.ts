import * as fs from 'fs'

const debug = require('debug')

export function flatMap<T, U>(arr: T[], fn: (i: T) => U[]): U[] {
  return arr.reduce((arr, i) => arr.concat(fn(i)), [] as U[])
}

export function mapValues<T extends Record<string, any>, TResult>(obj: {[P in keyof T]: T[P]}, fn: (i: T[keyof T], k: keyof T) => TResult): {[P in keyof T]: TResult} {
  return Object.entries(obj)
  .reduce((o, [k, v]) => {
    o[k] = fn(v as any, k as any)
    return o
  }, {} as any)
}

export function exists(path: string): Promise<boolean> {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => resolve(fs.existsSync(path)))
}

export function resolvePackage(id: string, paths: { paths: string[] }): string {
  return require.resolve(id, paths)
}

export function loadJSON(path: string): Promise<any> {
  debug('config')('loadJSON %s', path)
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err: any, d: any) => {
      try {
        if (err) reject(err)
        else resolve(JSON.parse(d))
      } catch (error: any) {
        reject(error)
      }
    })
  })
}

export function compact<T>(a: (T | undefined)[]): T[] {
  return a.filter((a): a is T => Boolean(a))
}

export function uniq<T>(arr: T[]): T[] {
  return arr.filter((a, i) => {
    return !arr.find((b, j) => j > i && b === a)
  })
}

function displayWarnings() {
  if (process.listenerCount('warning') > 1) return
  process.on('warning', (warning: any) => {
    console.error(warning.stack)
    if (warning.detail) console.error(warning.detail)
  })
}

export function Debug(...scope: string[]): (..._: any) => void {
  if (!debug) return (..._: any[]) => {}
  const d = debug(['config', ...scope].join(':'))
  if (d.enabled) displayWarnings()
  return (...args: any[]) => d(...args)
}
