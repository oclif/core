import * as fs from 'fs'

const debug = require('debug')

export function flatMap<T, U>(arr: T[], fn: (i: T) => U[]): U[] {
  return arr.reduce((arr, i) => arr.concat(fn(i)), [] as U[])
}

export function mapValues<T extends object, TResult>(obj: {[P in keyof T]: T[P]}, fn: (i: T[keyof T], k: keyof T) => TResult): {[P in keyof T]: TResult} {
  return Object.entries(obj)
  .reduce((o, [k, v]) => {
    o[k] = fn(v as any, k as any)
    return o
  }, {} as any)
}

export function exists(path: string): Promise<boolean> {
  return new Promise(resolve => resolve(fs.existsSync(path)))
}

export function loadJSON(path: string): Promise<any> {
  debug('config')('loadJSON %s', path)
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, d) => {
      try {
        if (err) reject(err)
        else resolve(JSON.parse(d))
      } catch (error) {
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

function termwidth(stream: any): number {
  if (!stream.isTTY) {
    return 80
  }
  const width = stream.getWindowSize()[0]
  if (width < 1) {
    return 80
  }
  if (width < 40) {
    return 40
  }
  return width
}

const columns: number | null = (global as any).columns

export const stdtermwidth = columns || termwidth(process.stdout)
export const errtermwidth = columns || termwidth(process.stderr)

function displayWarnings() {
  if (process.listenerCount('warning') > 1) return
  process.on('warning', (warning: any) => {
    console.error(warning.stack)
    if (warning.detail) console.error(warning.detail)
  })
}

export function Debug(...scope: string[]): (..._: any) => void {
  if (!debug) return (..._: any[]) => { }
  const d = debug(['config', ...scope].join(':'))
  if (d.enabled) displayWarnings()
  return (...args: any[]) => d(...args)
}
