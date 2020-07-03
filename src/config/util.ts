import * as fs from 'fs'

const debug = require('debug')('@oclif/config')

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
  debug('loadJSON %s', path)
  // let loadJSON
  // try { loadJSON = require('load-json-file') } catch {}
  // if (loadJSON) return loadJSON.sync(path)
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
