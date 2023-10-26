import {lstatSync} from 'node:fs'
import {extname, join, sep} from 'node:path'
import {pathToFileURL} from 'node:url'

import {Command} from './command'
import {tsPath} from './config/ts-node'
import {ModuleLoadError} from './errors'
import {Config as IConfig, Plugin as IPlugin} from './interfaces'
import {existsSync} from './util/fs'

const getPackageType = require('get-package-type')

/**
 * Defines file extension resolution when source files do not have an extension.
 */
// eslint-disable-next-line camelcase
const s_EXTENSIONS: string[] = ['.ts', '.js', '.mjs', '.cjs', '.mts', '.cts']

const isPlugin = (config: IConfig | IPlugin): config is IPlugin => (<IPlugin>config).type !== undefined

/**
 * Loads and returns a module.
 *
 * Uses `getPackageType` to determine if `type` is set to 'module. If so loads '.js' files as ESM otherwise uses
 * a bare require to load as CJS. Also loads '.mjs' files as ESM.
 *
 * Uses dynamic import to load ESM source or require for CommonJS.
 *
 * A unique error, ModuleLoadError, combines both CJS and ESM loader module not found errors into a single error that
 * provides a consistent stack trace and info.
 *
 * @param {IConfig|IPlugin} config - Oclif config or plugin config.
 * @param {string} modulePath - NPM module name or file path to load.
 *
 * @returns {Promise<*>} The entire ESM module from dynamic import or CJS module by require.
 */
export async function load<T = any>(config: IConfig | IPlugin, modulePath: string): Promise<T> {
  let filePath: string | undefined
  let isESM: boolean | undefined
  try {
    ;({filePath, isESM} = resolvePath(config, modulePath))
    return (isESM ? await import(pathToFileURL(filePath).href) : require(filePath)) as T
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new ModuleLoadError(`${isESM ? 'import()' : 'require'} failed to load ${filePath || modulePath}`)
    }

    throw error
  }
}

/**
 * Loads a module and returns an object with the module and data about the module.
 *
 * Uses `getPackageType` to determine if `type` is set to `module`. If so loads '.js' files as ESM otherwise uses
 * a bare require to load as CJS. Also loads '.mjs' files as ESM.
 *
 * Uses dynamic import to load ESM source or require for CommonJS.
 *
 * A unique error, ModuleLoadError, combines both CJS and ESM loader module not found errors into a single error that
 * provides a consistent stack trace and info.
 *
 * @param {IConfig|IPlugin} config - Oclif config or plugin config.
 * @param {string} modulePath - NPM module name or file path to load.
 *
 * @returns {Promise<{isESM: boolean, module: *, filePath: string}>} An object with the loaded module & data including
 *                                                                   file path and whether the module is ESM.
 */
export async function loadWithData<T = any>(
  config: IConfig | IPlugin,
  modulePath: string,
): Promise<{filePath: string; isESM: boolean; module: T}> {
  let filePath: string | undefined
  let isESM: boolean | undefined
  try {
    ;({filePath, isESM} = resolvePath(config, modulePath))
    const module = isESM ? await import(pathToFileURL(filePath).href) : require(filePath)
    return {filePath, isESM, module}
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new ModuleLoadError(
        `${isESM ? 'import()' : 'require'} failed to load ${filePath || modulePath}: ${error.message}`,
      )
    }

    throw error
  }
}

/**
 * Loads a module and returns an object with the module and data about the module.
 *
 * Uses cached `isESM` and `relativePath` in plugin manifest to determine if dynamic import (isESM = true)
 * or require (isESM = false | undefined) should be used.
 *
 * A unique error, ModuleLoadError, combines both CJS and ESM loader module not found errors into a single error that
 * provides a consistent stack trace and info.
 *
 * @param {Command.Cached} cached - Cached command data from plugin manifest.
 * @param {string} modulePath - NPM module name or file path to load.
 *
 * @returns {Promise<{isESM: boolean, module: *, filePath: string}>} An object with the loaded module & data including
 *                                                                   file path and whether the module is ESM.
 */
export async function loadWithDataFromManifest<T = any>(
  cached: Command.Cached,
  modulePath: string,
): Promise<{filePath: string; isESM: boolean; module: T}> {
  const {id, isESM, relativePath} = cached
  if (!relativePath) {
    throw new ModuleLoadError(`Cached command ${id} does not have a relative path`)
  }

  if (isESM === undefined) {
    throw new ModuleLoadError(`Cached command ${id} does not have the isESM property set`)
  }

  const filePath = join(modulePath, relativePath.join(sep))
  try {
    const module = isESM ? await import(pathToFileURL(filePath).href) : require(filePath)
    return {filePath, isESM, module}
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new ModuleLoadError(
        `${isESM ? 'import()' : 'require'} failed to load ${filePath || modulePath}: ${error.message}`,
      )
    }

    throw error
  }
}

/**
 * For `.js` files uses `getPackageType` to determine if `type` is set to `module` in associated `package.json`. If
 * the `modulePath` provided ends in `.mjs` it is assumed to be ESM.
 *
 * @param {string} filePath - File path to test.
 *
 * @returns {boolean} The modulePath is an ES Module.
 * @see https://www.npmjs.com/package/get-package-type
 */
export function isPathModule(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()

  switch (extension) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx': {
      return getPackageType.sync(filePath) === 'module'
    }

    case '.mjs':
    case '.mts': {
      return true
    }

    default: {
      return false
    }
  }
}

/**
 * Resolves a modulePath first by `require.resolve` to allow Node to resolve an actual module. If this fails then
 * the `modulePath` is resolved from the root of the provided config. `Config.tsPath` is used for initial resolution.
 * If this file path does not exist then several extensions are tried from `s_EXTENSIONS` in order: '.js', '.mjs',
 * '.cjs'. After a file path has been selected `isPathModule` is used to determine if the file is an ES Module.
 *
 * @param {IConfig|IPlugin} config - Oclif config or plugin config.
 * @param {string} modulePath - File path to load.
 *
 * @returns {{isESM: boolean, filePath: string}} An object including file path and whether the module is ESM.
 */
function resolvePath(config: IConfig | IPlugin, modulePath: string): {filePath: string; isESM: boolean} {
  let isESM: boolean
  let filePath: string | undefined

  try {
    filePath = require.resolve(modulePath)
    isESM = isPathModule(filePath)
  } catch {
    filePath =
      (isPlugin(config) ? tsPath(config.root, modulePath, config) : tsPath(config.root, modulePath)) ?? modulePath

    let fileExists = false
    let isDirectory = false
    if (existsSync(filePath)) {
      fileExists = true
      try {
        if (lstatSync(filePath)?.isDirectory?.()) {
          fileExists = false
          isDirectory = true
        }
      } catch {}
    }

    if (!fileExists) {
      // Try all supported extensions.
      let foundPath = findFile(filePath)
      if (!foundPath && isDirectory) {
        // Since filePath is a directory, try looking for index file.
        foundPath = findFile(join(filePath, 'index'))
      }

      if (foundPath) {
        filePath = foundPath
      }
    }

    isESM = isPathModule(filePath)
  }

  return {filePath, isESM}
}

/**
 * Try adding the different extensions from `s_EXTENSIONS` to find the file.
 *
 * @param {string} filePath - File path to load.
 *
 * @returns {string | null} Modified file path including extension or null if file is not found.
 */
function findFile(filePath: string): null | string {
  // eslint-disable-next-line camelcase
  for (const extension of s_EXTENSIONS) {
    const testPath = `${filePath}${extension}`

    if (existsSync(testPath)) {
      return testPath
    }
  }

  return null
}
