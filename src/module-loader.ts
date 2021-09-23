import * as path from 'path'
import * as url from 'url'
import * as fs from 'fs-extra'

import {ModuleLoadError} from './errors'
import {Config as IConfig} from './interfaces'
import {Plugin as IPlugin} from './interfaces'
import * as Config from './config'

const getPackageType = require('get-package-type')

/**
 * Defines file extension resolution when source files do not have an extension.
 */
// eslint-disable-next-line camelcase
const s_EXTENSIONS: string[] = ['.js', '.mjs', '.cjs']

/**
 * Provides a mechanism to use dynamic import / import() with tsconfig -> module: commonJS as otherwise import() gets
 * transpiled to require().
 */
const _importDynamic = new Function('modulePath', 'return import(modulePath)') // eslint-disable-line no-new-func

/**
 * Provides a static class with several utility methods to work with Oclif config / plugin to load ESM or CJS Node
 * modules and source files.
 *
 * @author Michael Leahy <support@typhonjs.io> (https://github.com/typhonrt)
 */
// eslint-disable-next-line unicorn/no-static-only-class
export default class ModuleLoader {
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
  static async load(config: IConfig|IPlugin, modulePath: string): Promise<any> {
    let filePath
    let isESM
    try {
      ({isESM, filePath} = ModuleLoader.resolvePath(config, modulePath))
      // It is important to await on _importDynamic to catch the error code.
      return isESM ? await _importDynamic(url.pathToFileURL(filePath)) : require(filePath)
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
  static async loadWithData(config: IConfig|IPlugin, modulePath: string): Promise<{isESM: boolean; module: any; filePath: string}> {
    let filePath
    let isESM
    try {
      ({isESM, filePath} = ModuleLoader.resolvePath(config, modulePath))
      const module = isESM ? await _importDynamic(url.pathToFileURL(filePath)) : require(filePath)
      return {isESM, module, filePath}
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new ModuleLoadError(`${isESM ? 'import()' : 'require'} failed to load ${filePath || modulePath}`)
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
  static isPathModule(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase()

    switch (extension) {
    case '.js':
      return getPackageType.sync(filePath) === 'module'

    case '.mjs':
      return true

    default:
      return false
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
  static resolvePath(config: IConfig|IPlugin, modulePath: string): {isESM: boolean; filePath: string} {
    let isESM: boolean
    let filePath: string

    try {
      filePath = require.resolve(modulePath)
      isESM = ModuleLoader.isPathModule(filePath)
    } catch {
      filePath = Config.tsPath(config.root, modulePath)

      // Try all supported extensions.
      if (!fs.existsSync(filePath)) {
        // eslint-disable-next-line camelcase
        for (const extension of s_EXTENSIONS) {
          const testPath = `${filePath}${extension}`

          if (fs.existsSync(testPath)) {
            filePath = testPath
            break
          }
        }
      }

      isESM = ModuleLoader.isPathModule(filePath)
    }

    return {isESM, filePath}
  }
}
