import * as fs from 'fs'
import * as path from 'path'

import {TSConfig} from '../interfaces/ts-config'
import {settings} from '../settings'
import {isProd} from '../util'
import {Debug} from './util'
// eslint-disable-next-line new-cap
const debug = Debug('ts-node')

function loadTSConfig(root: string): TSConfig | undefined {
  const tsconfigPath = path.join(root, 'tsconfig.json')
  let typescript: typeof import('typescript') | undefined
  try {
    typescript = require('typescript')
  } catch {
    try {
      typescript = require(root + '/node_modules/typescript')
    } catch {}
  }

  if (fs.existsSync(tsconfigPath) && typescript) {
    const tsconfig = typescript.parseConfigFileTextToJson(
      tsconfigPath,
      fs.readFileSync(tsconfigPath, 'utf8'),
    ).config
    if (!tsconfig || !tsconfig.compilerOptions) {
      throw new Error(
        `Could not read and parse tsconfig.json at ${tsconfigPath}, or it ` +
        'did not contain a "compilerOptions" section.')
    }

    return tsconfig
  }
}

/**
 * convert a path from the compiled ./lib files to the ./src typescript source
 * this is for developing typescript plugins/CLIs
 * if there is a tsconfig and the original sources exist, it attempts to require ts-
 */
export function tsPath(root: string, orig: string): string
export function tsPath(root: string, orig: string | undefined): string | undefined
export function tsPath(root: string, orig: string | undefined): string | undefined {
  if (!orig) return orig
  orig = path.join(root, orig)

  const skipTSNode =
    // the CLI specifically turned it off
    (settings.tsnodeEnabled === false) ||
    // the CLI didn't specify ts-node and it is production
    (settings.tsnodeEnabled === undefined && isProd())

  if (skipTSNode) return orig

  try {
    const tsconfig = loadTSConfig(root)
    if (!tsconfig) return orig
    const {rootDir, rootDirs, outDir} = tsconfig.compilerOptions
    const rootDirPath = rootDir || (rootDirs || [])[0]
    if (!rootDirPath || !outDir) return orig
    // rewrite path from ./lib/foo to ./src/foo
    const lib = path.join(root, outDir) // ./lib
    const src = path.join(root, rootDirPath) // ./src
    const relative = path.relative(lib, orig) // ./commands
    // For hooks, it might point to a js file, not a module. Something like "./hooks/myhook.js" which doesn't need the js.
    const out = path.join(src, relative).replace(/\.js$/, '') // ./src/commands
    // this can be a directory of commands or point to a hook file
    // if it's a directory, we check if the path exists. If so, return the path to the directory.
    // For hooks, it might point to a module, not a file. Something like "./hooks/myhook"
    // That file doesn't exist, and the real file is "./hooks/myhook.ts"
    // In that case we attempt to resolve to the filename. If it fails it will revert back to the lib path
    if (fs.existsSync(out) || fs.existsSync(out + '.ts')) return out
    return orig
  } catch (error: any) {
    debug(error)
    return orig
  }
}
