import * as path from 'path'
import * as url from 'url'

import {ModuleLoadError} from './errors'
import {Config as IConfig} from './interfaces'
import {Plugin as IPlugin} from './interfaces'
import * as Config from './config'

const getPackageType = require('get-package-type')

/**
 * Provides a mechanism to use dynamic import / import() with tsconfig -> module: commonJS as otherwise import() gets
 * transpiled to require().
 */
const _importDynamic = new Function('modulePath', 'return import(modulePath)') // eslint-disable-line no-new-func

export default class ModuleLoader {
  /**
   * Loads and returns a module.
   *
   * Uses `getPackageType` to determine if `type` is set to 'module. If so loads '.js' files as ESM otherwise uses
   * a bare require to load as CJS. Also loads '.mjs' files as ESM.
   *
   * Uses dynamic import to load ESM files or require for CommonJS.
   *
   * A unique error, ModuleLoadError, combines both CJS and ESM loader module not found errors into a single error that
   * provides a consistent stack trace and info.
   *
   * @param {IConfig|IPlugin} config - Oclif config or plugin config.
   * @param {string} modulePath - File path to load.
   *
   * @returns {Promise<*>} The imported default ESM export or CJS file by require.
   */
  static async load(config: IConfig|IPlugin, modulePath: string): Promise<any> {
    const {isESM, filePath} = ModuleLoader.resolvePath(config, modulePath)
    try {
      // It is important to await on _importDynamic to catch the error code.
      return isESM ? await _importDynamic(url.pathToFileURL(filePath)) : require(filePath)
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new ModuleLoadError(`${isESM ? 'import()' : 'require'} failed to load ${filePath}`)
      }
      throw error
    }
  }

  /**
   * Loads a module and returns an object with the module and data about the module.
   *
   * Uses `getPackageType` to determine if `type` is set to 'module. If so loads '.js' files as ESM otherwise uses
   * a bare require to load as CJS. Also loads '.mjs' files as ESM.
   *
   * Uses dynamic import to load ESM files or require for CommonJS.
   *
   * A unique error, ModuleLoadError, combines both CJS and ESM loader module not found errors into a single error that
   * provides a consistent stack trace and info.
   *
   * @param {IConfig|IPlugin} config - Oclif config or plugin config.
   * @param {string} modulePath - File path to load.
   *
   * @returns {Promise<{isESM: boolean, module: *, filePath: string}>} An object with the loaded module & data including
   *                                                                   file path and whether the module is ESM.
   */
  static async loadWithData(config: IConfig|IPlugin, modulePath: string): Promise<{isESM: boolean; module: any; filePath: string}> {
    const {isESM, filePath} = ModuleLoader.resolvePath(config, modulePath)
    try {
      const module = isESM ? await _importDynamic(url.pathToFileURL(filePath)) : require(filePath)
      return {isESM, module, filePath}
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new ModuleLoadError(`${isESM ? 'import()' : 'require'} failed to load ${filePath}`)
      }
      throw error
    }
  }

  /**
   * For `.js` files uses `getPackageType` to determine if `type` is set to `module` in associated `package.json`. If
   * the `modulePath` provided ends in `.mjs` it is assumed to be ESM.
   *
   * @param {string} modulePath - File path to load.
   *
   * @returns {boolean} The modulePath is an ES Module.
   */
  static isPathModule(modulePath: string): boolean {
    const extension = path.extname(modulePath).toLowerCase()

    switch (extension) {
    case '.js':
      return getPackageType.sync(modulePath) === 'module'

    case '.mjs':
      return true

    default:
      return false
    }
  }

  /**
   * Resolves a modulePath first by `require.resolve` to allow Node to resolve an actual module. If this fails then
   * the `modulePath` is resolved from the root of the provided config. `require.resolve` is used for ESM and `tsPath`
   * for non-ESM paths.
   *
   * @param {IConfig|IPlugin} config - Oclif config or plugin config.
   * @param {string} modulePath - File path to load.
   *
   * @returns {{isESM: boolean, filePath: string}} An object including file path and whether the module is ESM.
   */
  static resolvePath(config: IConfig|IPlugin, modulePath: string): {isESM: boolean; filePath: string} {
    let isESM = config.pjson.type === 'module'
    let filePath

    try {
      filePath = require.resolve(modulePath)
      isESM = ModuleLoader.isPathModule(filePath)
    } catch (error) {
      filePath = isESM ? path.resolve(path.join(config.root, modulePath)) : Config.tsPath(config.root, modulePath)
    }

    return {isESM, filePath}
  }
}
