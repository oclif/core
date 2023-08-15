import * as fs from 'fs'
import * as path from 'path'
import * as TSNode from 'ts-node'

import {TSConfig} from '../interfaces/ts-config'
import {settings} from '../settings'
import {isProd} from '../util'
import {Debug} from './util'
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

function registerTSNode(root: string) {
  const tsconfig = loadTSConfig(root)
  if (!tsconfig) return
  if (REGISTERED.has(root)) return tsconfig
  debug('registering ts-node at', root)
  const tsNodePath = require.resolve('ts-node', {paths: [root, __dirname]})
  debug('ts-node path:', tsNodePath)
  const tsNode: typeof TSNode = require(tsNodePath)

  const typeRoots = [
    path.join(__dirname, '..', '..', 'node_modules', '@types'),
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

  const cwd = process.cwd()
  try {
    process.chdir(root)
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
  } finally {
    process.chdir(cwd)
  }
}

/**
 * Convert a path from the compiled ./lib files to the ./src typescript source
 * this is for developing typescript plugins/CLIs
 * if there is a tsconfig and the original sources exist, it attempts to require ts-node
 */
export function tsPath(root: string, orig: string, type?: string): string
export function tsPath(root: string, orig: string | undefined, type?: string): string | undefined
export function tsPath(root: string, orig: string | undefined, type?: string): string | undefined {
  if (!orig) return orig
  orig = orig.startsWith(root) ? orig : path.join(root, orig)

  const skipTSNode =
    // the CLI specifically turned it off
    (settings.tsnodeEnabled === false) ||
    // the CLI didn't specify ts-node and it is production
    (settings.tsnodeEnabled === undefined && isProd())

  // We always want to load the tsconfig for linked plugins.
  if (skipTSNode && type !== 'link') return orig

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
