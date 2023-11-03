import {Stats, existsSync as fsExistsSync, readFileSync} from 'node:fs'
import {readFile, stat} from 'node:fs/promises'
import {join} from 'node:path'

export function requireJson<T>(...pathParts: string[]): T {
  return JSON.parse(readFileSync(join(...pathParts), 'utf8'))
}

/**
 * Parser for Args.directory and Flags.directory. Checks that the provided path
 * exists and is a directory.
 * @param input flag or arg input
 * @returns Promise<string>
 */
export const dirExists = async (input: string): Promise<string> => {
  let dirStat: Stats
  try {
    dirStat = await stat(input)
  } catch {
    throw new Error(`No directory found at ${input}`)
  }

  if (!dirStat.isDirectory()) {
    throw new Error(`${input} exists but is not a directory`)
  }

  return input
}

/**
 * Parser for Args.file and Flags.file. Checks that the provided path
 * exists and is a file.
 * @param input flag or arg input
 * @returns Promise<string>
 */
export const fileExists = async (input: string): Promise<string> => {
  let fileStat: Stats
  try {
    fileStat = await stat(input)
  } catch {
    throw new Error(`No file found at ${input}`)
  }

  if (!fileStat.isFile()) {
    throw new Error(`${input} exists but is not a file`)
  }

  return input
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const contents = await readFile(path, 'utf8')
  return JSON.parse(contents) as T
}

export function readJsonSync(path: string, parse: false): string
export function readJsonSync<T = unknown>(path: string, parse?: true): T
export function readJsonSync<T = unknown>(path: string, parse = true): T | string {
  const contents = readFileSync(path, 'utf8')
  return parse ? (JSON.parse(contents) as T) : contents
}

export async function safeReadJson<T>(path: string): Promise<T | undefined> {
  try {
    return await readJson<T>(path)
  } catch {}
}

export function existsSync(path: string): boolean {
  return fsExistsSync(path)
}

export async function readTSConfig(path: string) {
  const {parse} = await import('tsconfck')
  const result = await parse(path)
  const tsNodeOpts = Object.fromEntries(
    (result.extended ?? []).flatMap((e) => Object.entries(e.tsconfig['ts-node'] ?? {})).reverse(),
  )
  return {...result.tsconfig, 'ts-node': tsNodeOpts}
}
