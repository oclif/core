import * as fs from 'fs'

export function pickBy<T extends { [s: string]: T[keyof T]; } | ArrayLike<T[keyof T]>>(obj: T, fn: (i: T[keyof T]) => boolean): Partial<T> {
  return Object.entries(obj)
  .reduce((o, [k, v]) => {
    if (fn(v)) o[k] = v
    return o
  }, {} as any)
}

export function compact<T>(a: (T | undefined)[]): T[] {
  return a.filter((a): a is T => Boolean(a))
}

export function uniqBy<T>(arr: T[], fn: (cur: T) => any): T[] {
  return arr.filter((a, i) => {
    const aVal = fn(a)
    return !arr.find((b, j) => j > i && fn(b) === aVal)
  })
}

type SortTypes = string | number | undefined | boolean

export function sortBy<T>(arr: T[], fn: (i: T) => SortTypes | SortTypes[]): T[] {
  function compare(a: SortTypes | SortTypes[], b: SortTypes | SortTypes[]): number {
    a = a === undefined ? 0 : a
    b = b === undefined ? 0 : b

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === 0 && b.length === 0) return 0
      const diff = compare(a[0], b[0])
      if (diff !== 0) return diff
      return compare(a.slice(1), b.slice(1))
    }

    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  return arr.sort((a, b) => compare(fn(a), fn(b)))
}

export function castArray<T>(input?: T | T[]): T[] {
  if (input === undefined) return []
  return Array.isArray(input) ? input : [input]
}

export function isProd(): boolean {
  return !['development', 'test'].includes(process.env.NODE_ENV ?? '')
}

export function maxBy<T>(arr: T[], fn: (i: T) => number): T | undefined {
  if (arr.length === 0) {
    return undefined
  }

  return arr.reduce((maxItem, i) => {
    const curr = fn(i)
    const max = fn(maxItem)
    return curr > max ? i : maxItem
  })
}

export function sumBy<T>(arr: T[], fn: (i: T) => number): number {
  return arr.reduce((sum, i) => sum + fn(i), 0)
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''
}

export const dirExists = async (input: string): Promise<string> => {
  if (!fs.existsSync(input)) {
    throw new Error(`No directory found at ${input}`)
  }

  if (!(await fs.promises.stat(input)).isDirectory()) {
    throw new Error(`${input} exists but is not a directory`)
  }

  return input
}

export const fileExists = async (input: string): Promise<string> => {
  if (!fs.existsSync(input)) {
    throw new Error(`No file found at ${input}`)
  }

  if (!(await fs.promises.stat(input)).isFile()) {
    throw new Error(`${input} exists but is not a file`)
  }

  return input
}

export function isTruthy(input: string): boolean {
  return ['true', 'TRUE', '1', 'yes', 'YES', 'y', 'Y'].includes(input)
}

export function isNotFalsy(input: string): boolean {
  return !['false', 'FALSE', '0', 'no', 'NO', 'n', 'N'].includes(input)
}
