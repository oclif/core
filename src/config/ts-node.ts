import * as TSNode from 'ts-node'
import {Plugin, TSConfig} from '../interfaces'
import {existsSync, readFileSync} from 'node:fs'
import {join, relative as pathRelative} from 'node:path'
import {Config} from './config'
import {Debug} from './util'
import {isProd} from '../util'
import {memoizedWarn} from '../errors'
import {settings} from '../settings'

// eslint-disable-next-line new-cap
const debug = Debug('ts-node')

export const TS_CONFIGS: Record<string, TSConfig> = {}
const REGISTERED = new Set<string>()

function loadTSConfig(root: string): TSConfig | undefined {
  if (TS_CONFIGS[root]) return TS_CONFIGS[root]
  const tsconfigPath = join(root, 'tsconfig.json')
  let typescript: typeof import('typescript') | undefined
  try {
    typescript = require('typescript')
  } catch {
    try {
      typescript = require(join(root, 'node_modules', 'typescript'))
    } catch {}
  }

  if (existsSync(tsconfigPath) && typescript) {
    const tsconfig = typescript.parseConfigFileTextToJson(
      tsconfigPath,
      readFileSync(tsconfigPath, 'utf8'),
    ).config
    if (!tsconfig || !tsconfig.compilerOptions) {
      throw new Error(
        `Could not read and parse tsconfig.json at ${tsconfigPath}, or it `
        + 'did not contain a "compilerOptions" section.')
    }

    TS_CONFIGS[root] = tsconfig
    return tsconfig
  }
}

function registerTSNode(root: string): TSConfig | undefined {
  const tsconfig = loadTSConfig(root)
  if (!tsconfig) return
  if (REGISTERED.has(root)) return tsconfig
  debug('registering ts-node at', root)
  const tsNodePath = require.resolve('ts-node', {paths: [root, __dirname]})
  debug('ts-node path:', tsNodePath)
  const tsNode: typeof TSNode = require(tsNodePath)

  const typeRoots = [
    join(root, 'node_modules', '@types'),
  ]

  const rootDirs: string[] = []

  if (tsconfig.compilerOptions.rootDirs) {
    for (const r of tsconfig.compilerOptions.rootDirs) {
      rootDirs.push(join(root, r))
    }
  } else if (tsconfig.compilerOptions.rootDir) {
    rootDirs.push(join(root, tsconfig.compilerOptions.rootDir))
  } else {
    rootDirs.push(join(root, 'src'))
  }

  const conf: TSNode.RegisterOptions = {
    compilerOptions: {
      esModuleInterop: tsconfig.compilerOptions.esModuleInterop,
      target: tsconfig.compilerOptions.target ?? 'es2019',
      experimentalDecorators: tsconfig.compilerOptions.experimentalDecorators ?? false,
      emitDecoratorMetadata: tsconfig.compilerOptions.emitDecoratorMetadata ?? false,
      module: tsconfig.compilerOptions.module ?? 'commonjs',
      sourceMap: tsconfig.compilerOptions.sourceMap ?? true,
      rootDirs,
      typeRoots,
    },
    skipProject: true,
    transpileOnly: true,
    esm: tsconfig['ts-node']?.esm ?? true,
    scope: true,
    scopeDir: root,
    cwd: root,
    experimentalSpecifierResolution: tsconfig['ts-node']?.experimentalSpecifierResolution ?? 'explicit',
  }

  if (tsconfig.compilerOptions.moduleResolution) {
    // @ts-expect-error TSNode.RegisterOptions.compilerOptions is typed as a plain object
    conf.compilerOptions.moduleResolution = tsconfig.compilerOptions.moduleResolution
  }

  if (tsconfig.compilerOptions.jsx) {
    // @ts-expect-error TSNode.RegisterOptions.compilerOptions is typed as a plain object
    conf.compilerOptions.jsx = tsconfig.compilerOptions.jsx
  }

  tsNode.register(conf)
  REGISTERED.add(root)

  return tsconfig
}

/**
 * Convert a path from the compiled ./lib files to the ./src typescript source
 * this is for developing typescript plugins/CLIs
 * if there is a tsconfig and the original sources exist, it attempts to require ts-node
 */
export function tsPath(root: string, orig: string, plugin: Plugin): string
export function tsPath(root: string, orig: string | undefined, plugin?: Plugin): string | undefined
export function tsPath(root: string, orig: string | undefined, plugin?: Plugin): string | undefined {
  if (!orig) return orig
  orig = orig.startsWith(root) ? orig : join(root, orig)

  // NOTE: The order of these checks matter!

  if (settings.tsnodeEnabled === false) {
    debug(`Skipping ts-node registration for ${root} because tsNodeEnabled is explicitly set to false`)
    return orig
  }

  const isProduction = isProd()
  /**
   * Skip ts-node registration for ESM plugins.
   * The node ecosystem is not mature enough to support auto-transpiling ESM modules at this time.
   * See the following:
   * - https://github.com/TypeStrong/ts-node/issues/1791#issuecomment-1149754228
   * - https://github.com/nodejs/node/issues/49432
   * - https://github.com/nodejs/node/pull/49407
   * - https://github.com/nodejs/node/issues/34049
   *
   * We still register ts-node for ESM plugins when NODE_ENV is "test" or "development" and root plugin is also ESM.
   * In other words, this allows plugins to be auto-transpiled when developing locally using `bin/dev.js`.
   */
  if ((isProduction || Config.rootPlugin?.moduleType === 'commonjs') && plugin?.moduleType === 'module') {
    debug(`Skipping ts-node registration for ${root} because it's an ESM module (NODE_ENV: ${process.env.NODE_ENV}, root plugin module type: ${Config.rootPlugin?.moduleType})))`)
    if (plugin.type === 'link')
      memoizedWarn(`${plugin.name} is a linked ESM module and cannot be auto-transpiled. Existing compiled source will be used instead.`)

    return orig
  }

  if (settings.tsnodeEnabled === undefined && isProduction && plugin?.type !== 'link') {
    debug(`Skipping ts-node registration for ${root} because NODE_ENV is NOT "test" or "development"`)
    return orig
  }

  try {
    const tsconfig = registerTSNode(root)
    if (!tsconfig) return orig
    const {rootDir, rootDirs, outDir} = tsconfig.compilerOptions
    const rootDirPath = rootDir || (rootDirs || [])[0]
    if (!rootDirPath || !outDir) return orig
    // rewrite path from ./lib/foo to ./src/foo
    const lib = join(root, outDir) // ./lib
    const src = join(root, rootDirPath) // ./src
    const relative = pathRelative(lib, orig) // ./commands
    // For hooks, it might point to a js file, not a module. Something like "./hooks/myhook.js" which doesn't need the js.
    const out = join(src, relative).replace(/\.js$/, '') // ./src/commands
    // this can be a directory of commands or point to a hook file
    // if it's a directory, we check if the path exists. If so, return the path to the directory.
    // For hooks, it might point to a module, not a file. Something like "./hooks/myhook"
    // That file doesn't exist, and the real file is "./hooks/myhook.ts"
    // In that case we attempt to resolve to the filename. If it fails it will revert back to the lib path
    if (existsSync(out) || existsSync(out + '.ts')) return out
    return orig
  } catch (error: any) {
    debug(error)
    return orig
  }
}
