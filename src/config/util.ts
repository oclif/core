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
  return [...new Set(arr)].sort()
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

// Adapted from https://github.com/angus-c/just/blob/master/packages/array-permutations/index.js
export function getPerumtations(arr: string[]): Array<string[]> {
  if (arr.length === 0) return []
  if (arr.length === 1) return [arr]

  const output = []
  const partialPermutations = getPerumtations(arr.slice(1))
  const first = arr[0]

  for (let i = 0, len = partialPermutations.length; i < len; i++) {
    const partial = partialPermutations[i]

    for (let j = 0, len2 = partial.length; j <= len2; j++) {
      const start = partial.slice(0, j)
      const end = partial.slice(j)
      const merged = start.concat(first, end)

      output.push(merged)
    }
  }

  return output
}

export function getCommandIdPermutations(commandId: string): string[] {
  return getPerumtations(commandId.split(':')).flatMap(c => c.join(':'))
}

/**
 * Return an array of ids that represent all the usable combinations that a user could enter.
 *
 * For example, if the command ids are:
 * - foo:bar:baz
 * - one:two:three
 * Then the usable ids would be:
 * - foo
 * - foo:bar
 * - foo:bar:baz
 * - one
 * - one:two
 * - one:two:three
 *
 * This allows us to determine which parts of the argv array belong to the command id whenever the topicSeparator is a space.
 *
 * @param items string[]
 * @returns string[]
 */
export function collectUsableIds(items: string[]): string[] {
  const final: string[] = []
  for (const item of items) {
    const parts = item.split(':')
    while (parts.length > 0) {
      const name = parts.join(':')
      if (name) final.push(name)
      parts.pop()
    }
  }

  return uniq(final).sort()
}
