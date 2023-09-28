import {access, readFile, stat} from 'node:fs/promises'
import {homedir, platform} from 'node:os'
import {ArgInput} from '../interfaces/parser'
import {Command} from '../command'
import {join} from 'node:path'
import {readFileSync} from 'node:fs'

const debug = require('debug')

export function pickBy<T extends {[s: string]: T[keyof T]} | ArrayLike<T[keyof T]>>(
  obj: T,
  fn: (i: T[keyof T]) => boolean,
): Partial<T> {
  return Object.entries(obj).reduce((o, [k, v]) => {
    if (fn(v)) o[k] = v
    return o
  }, {} as any)
}

export function compact<T>(a: (T | undefined)[]): T[] {
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  return a.filter((a): a is T => Boolean(a))
}

export function uniqBy<T>(arr: T[], fn: (cur: T) => any): T[] {
  return arr.filter((a, i) => {
    const aVal = fn(a)
    return !arr.find((b, j) => j > i && fn(b) === aVal)
  })
}

export function last<T>(arr?: T[]): T | undefined {
  if (!arr) return
  return arr.at(-1)
}

type SortTypes = string | number | undefined | boolean

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

export function sortBy<T>(arr: T[], fn: (i: T) => SortTypes | SortTypes[]): T[] {
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

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export const dirExists = async (input: string): Promise<string> => {
  if (!(await exists(input))) {
    throw new Error(`No directory found at ${input}`)
  }

  const fileStat = await stat(input)
  if (!fileStat.isDirectory()) {
    throw new Error(`${input} exists but is not a directory`)
  }

  return input
}

export const fileExists = async (input: string): Promise<string> => {
  if (!(await exists(input))) {
    throw new Error(`No file found at ${input}`)
  }

  const fileStat = await stat(input)
  if (!fileStat.isFile()) {
    throw new Error(`${input} exists but is not a file`)
  }

  return input
}

export function isTruthy(input: string): boolean {
  return ['true', '1', 'yes', 'y'].includes(input.toLowerCase())
}

export function isNotFalsy(input: string): boolean {
  return !['false', '0', 'no', 'n'].includes(input.toLowerCase())
}

export function requireJson<T>(...pathParts: string[]): T {
  return JSON.parse(readFileSync(join(...pathParts), 'utf8'))
}

/**
 * Ensure that the provided args are an object. This is for backwards compatibility with v1 commands which
 * defined args as an array.
 *
 * @param args Either an array of args or an object of args
 * @returns ArgInput
 */
export function ensureArgObject(args?: any[] | ArgInput | {[name: string]: Command.Arg.Cached}): ArgInput {
  return (
    Array.isArray(args) ? (args ?? []).reduce((x, y) => ({...x, [y.name]: y}), {} as ArgInput) : args ?? {}
  ) as ArgInput
}

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)].sort()
}

/**
 * Call os.homedir() and return the result
 *
 * Wrapping this allows us to stub these in tests since os.homedir() is
 * non-configurable and non-writable.
 *
 * @returns The user's home directory
 */
export function getHomeDir(): string {
  return homedir()
}

/**
 * Call os.platform() and return the result
 *
 * Wrapping this allows us to stub these in tests since os.platform() is
 * non-configurable and non-writable.
 *
 * @returns The process' platform
 */
export function getPlatform(): NodeJS.Platform {
  return platform()
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  debug('config')('readJson %s', path)
  const contents = await readFile(path, 'utf8')
  return JSON.parse(contents) as T
}

export function readJsonSync(path: string, parse: false): string
export function readJsonSync<T = unknown>(path: string, parse?: true): T
export function readJsonSync<T = unknown>(path: string, parse = true): T | string {
  const contents = readFileSync(path, 'utf8')
  return parse ? (JSON.parse(contents) as T) : contents
}

export function mapValues<T extends Record<string, any>, TResult>(
  obj: {[P in keyof T]: T[P]},
  fn: (i: T[keyof T], k: keyof T) => TResult,
): {[P in keyof T]: TResult} {
  return Object.entries(obj).reduce((o, [k, v]) => {
    o[k] = fn(v as any, k as any)
    return o
  }, {} as any)
}
