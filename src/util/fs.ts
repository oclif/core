import {Stats, existsSync as fsExistsSync} from 'node:fs'
import {readFile, stat} from 'node:fs/promises'

import {isProd} from './util'

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

class ProdOnlyCache extends Map<string, string> {
  set(key: string, value: string): this {
    if (isProd() ?? false) {
      super.set(key, value)
    }

    return this
  }
}

const cache = new ProdOnlyCache()

/**
 * Read a file from disk and cache its contents if in production environment.
 *
 * Will throw an error if the file does not exist.
 *
 * @param path file path of JSON file
 * @param useCache if false, ignore cache and read file from disk
 * @returns <T>
 */
export async function readJson<T = unknown>(path: string, useCache = true): Promise<T> {
  if (useCache && cache.has(path)) {
    return JSON.parse(cache.get(path)!) as T
  }

  const contents = await readFile(path, 'utf8')
  cache.set(path, contents)
  return JSON.parse(contents) as T
}

/**
 * Safely read a file from disk and cache its contents if in production environment.
 *
 * Will return undefined if the file does not exist.
 *
 * @param path file path of JSON file
 * @param useCache if false, ignore cache and read file from disk
 * @returns <T> or undefined
 */
export async function safeReadJson<T>(path: string, useCache = true): Promise<T | undefined> {
  try {
    return await readJson<T>(path, useCache)
  } catch {}
}

export function existsSync(path: string): boolean {
  return fsExistsSync(path)
}
