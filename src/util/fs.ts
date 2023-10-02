import {access, readFile, stat} from 'node:fs/promises'
import {join} from 'node:path'
import {readFileSync} from 'node:fs'

const debug = require('debug')

export function requireJson<T>(...pathParts: string[]): T {
  return JSON.parse(readFileSync(join(...pathParts), 'utf8'))
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
