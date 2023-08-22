import * as fs from 'fs'
import * as path from 'path'
import * as TSNode from 'ts-node'

import {TSConfig, Plugin} from '../interfaces'
import settings from '../settings'
import {isProd} from '../util'
import {Debug} from './util'
import {Config} from './config'
import {memoizedWarn} from '../errors'
// eslint-disable-next-line new-cap
const debug = Debug('ts-node')

const TS_CONFIGS: Record<string, TSConfig> = {}
const REGISTERED = new Set<string>()

function loadTSConfig(root: string): TSConfig | undefined {
  if (TS_CONFIGS[root]) return TS_CONFIGS[root]
  const tsconfigPath = path.join(root, 'tsconfig.json')
  let typescript: typeof import('typescript') | undefined
  try {
    typescript = require('typescript')
  } catch {
    try {
      typescript = require(path.join(root, 'node_modules', 'typescript'))
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
    path.join(root, 'node_modules', '@types'),
  ]

  const rootDirs: string[] = []

  if (tsconfig.compilerOptions.rootDirs) {
    for (const r of tsconfig.compilerOptions.rootDirs) {
      rootDirs.push(path.join(root, r))
    }
  } else if (tsconfig.compilerOptions.rootDir) {
    rootDirs.push(path.join(root, tsconfig.compilerOptions.rootDir))
  } else {
    rootDirs.push(path.join(root, 'src'))
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
// eslint-disable-next-line complexity
export function tsPath(root: string, orig: string | undefined, plugin?: Plugin): string | undefined {
  if (!orig) return orig
  orig = orig.startsWith(root) ? orig : path.join(root, orig)

  // NOTE: The order of these checks matter!

  if (settings.tsnodeEnabled === false) {
    debug(`Skipping ts-node registration for ${root} because tsNodeEnabled is explicitly set to false`)
    return orig
  }

  // Skip ts-node registration if plugin is an ESM plugin executing from a CJS plugin
  if (plugin?.moduleType === 'module' && Config.rootPlugin?.moduleType === 'commonjs') {
    debug(`Skipping ts-node registration for ${root} because it's an ESM module but the root plugin is CommonJS`)
    if (plugin.type === 'link')
      memoizedWarn(`${plugin.name} is a linked ESM module and cannot be auto-compiled from a CommonJS root plugin. Existing compiled source will be used instead.`)

    return orig
  }

  // If plugin is an ESM plugin being executed from an ESM root plugin, check to see if ts-node/esm loader has been set
  // either in the NODE_OPTIONS env var or from the exec args. If the ts-node/esm loader has NOT been loaded then we want
  // to skip ts-node registration so that it falls back on the compiled source.
  if (plugin?.moduleType === 'module') {
    const tsNodeEsmLoaderInExecArgv = process.execArgv.includes('--loader') && process.execArgv.includes('ts-node/esm')
    const tsNodeEsmLoaderInNodeOptions = process.env.NODE_OPTIONS?.includes('--loader=ts-node/esm') ?? false
    if (!tsNodeEsmLoaderInExecArgv && !tsNodeEsmLoaderInNodeOptions) {
      debug(`Skipping ts-node registration for ${root} because it's an ESM module but the ts-node/esm loader hasn't been run`)
      debug('try setting NODE_OPTIONS="--loader ts-node/esm" in your environment.')
      if (plugin.type === 'link') {
        memoizedWarn(`${plugin.name} is a linked ESM module and cannot be auto-compiled without setting NODE_OPTIONS="--loader=ts-node/esm" in the environment. Existing compiled source will be used instead.`)
      }

      return orig
    }
  }

  if (settings.tsnodeEnabled === undefined && isProd() && plugin?.type !== 'link') {
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
