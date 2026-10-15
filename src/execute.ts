/* eslint-disable n/file-extension-in-import -- Node 24 tests run from TypeScript source through ts-node. */
import {fileURLToPath} from 'node:url'

import type {LoadOptions, Options} from './interfaces'

import {CLIError} from './errors'
import {handle} from './errors/handle'
import {flush} from './flush'
import {run} from './main'
import {settings} from './settings'

type ExecuteOptions = Omit<Options, 'root'> & {root?: string}

function isOptions(loadOptions: LoadOptions | ExecuteOptions): loadOptions is ExecuteOptions {
  return typeof loadOptions === 'object' && loadOptions !== null && !('runCommand' in loadOptions)
}

function normalizeLoadOptions(dir: string | undefined, loadOptions: LoadOptions | ExecuteOptions): LoadOptions {
  if (!loadOptions || !isOptions(loadOptions)) return loadOptions ?? dir

  const root = loadOptions.root ?? (dir?.startsWith('file://') ? fileURLToPath(dir) : dir)
  if (!root) throw new CLIError('dir or loadOptions.root is required.')
  return {...loadOptions, root}
}

/**
 * Load and run oclif CLI
 *
 * @example For ESM dev.js
 * ```
 * #!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
 * import { execute } from '@oclif/core'
 *
 * await execute({development: true, dir: import.meta.url})
 * ```
 *
 * @example For ESM run.js
 * ```
 * #!/usr/bin/env node
 * import { execute } from '@oclif/core'
 *
 * await execute({dir: import.meta.url})
 * ```
 *
 * @example For CJS dev.js
 * ```
 * #!/usr/bin/env ts-node
 * void (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({development: true, dir: __dirname})
 * })()
 * ```
 *
 * @example For CJS run.js
 * ```
 * #!/usr/bin/env node
 * void (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({dir: __dirname})
 * })()
 * ```
 */
type ExecuteArguments = {
  args?: string[]
  development?: boolean
}

export function execute(
  options: ExecuteArguments & {dir: string; loadOptions?: LoadOptions | ExecuteOptions},
): Promise<unknown>
// eslint-disable-next-line @typescript-eslint/unified-signatures -- The overload requires dir when object load options omit root.
export function execute(
  options: ExecuteArguments & {dir?: string; loadOptions: Exclude<LoadOptions, undefined>},
): Promise<unknown>
export async function execute(
  options: ExecuteArguments & {dir?: string; loadOptions?: LoadOptions | ExecuteOptions},
): Promise<unknown> {
  if (!options.dir && !options.loadOptions) {
    throw new CLIError('dir or loadOptions is required.')
  }

  if (options.development) {
    // In dev mode -> use ts-node and dev plugins
    process.env.NODE_ENV = 'development'
    settings.debug = true
  }

  try {
    const result = await run(
      options.args ?? process.argv.slice(2),
      normalizeLoadOptions(options.dir, options.loadOptions),
    )
    flush()
    return result
  } catch (error) {
    return handle(error instanceof Error ? error : new Error(String(error)))
  }
}
