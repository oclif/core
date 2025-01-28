import {readdir, readFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'

import {memoizedWarn} from '../errors/warn'
import {TSConfig} from '../interfaces'
import {makeDebug} from '../logger'
import {mergeNestedObjects} from './util'

const debug = makeDebug('read-tsconfig')

function resolve(root: string, name: string): string | undefined {
  try {
    return require.resolve(name, {paths: [root]})
  } catch {
    // return undefined
  }
}

async function upUntil(path: string, test: (path: string) => Promise<boolean>): Promise<string | undefined> {
  let result: boolean | undefined
  try {
    result = await test(path)
  } catch {
    result = false
  }

  if (result) return path

  const parent = dirname(path)
  if (parent === path) return

  return upUntil(parent, test)
}

export async function readTSConfig(root: string, tsconfigName = 'tsconfig.json'): Promise<TSConfig | undefined> {
  const found: Record<string, any>[] = []

  let typescript: typeof import('typescript') | undefined
  try {
    typescript = require('typescript')
  } catch {
    try {
      typescript = require(root + '/node_modules/typescript')
    } catch {}
  }

  if (!typescript) {
    memoizedWarn(
      'Could not find typescript. Please ensure that typescript is a devDependency. Falling back to compiled source.',
    )
    return
  }

  const read = async (path: string): Promise<unknown> => {
    const localRoot = await upUntil(path, async (p) => (await readdir(p)).includes('package.json'))
    if (!localRoot) return

    try {
      const contents = await readFile(path, 'utf8')
      const parsed = typescript?.parseConfigFileTextToJson(path, contents).config

      found.push(parsed)

      if (parsed.extends) {
        if (parsed.extends.startsWith('.')) {
          const nextPath = resolve(localRoot, parsed.extends)
          return nextPath ? read(nextPath) : undefined
        }

        const resolved = resolve(localRoot, parsed.extends)
        if (resolved) return read(resolved)
      }

      return parsed
    } catch (error) {
      debug(error)
    }
  }

  await read(join(root, tsconfigName))

  return {
    compilerOptions: mergeNestedObjects(found, 'compilerOptions'),
    'ts-node': mergeNestedObjects(found, 'ts-node'),
  }
}
