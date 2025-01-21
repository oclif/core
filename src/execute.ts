import {CLIError} from './errors'
import {handle} from './errors/handle'
import {flush} from './flush'
import {LoadOptions} from './interfaces'
import {run} from './main'
import {settings} from './settings'

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
export async function execute(options: {
  args?: string[]
  development?: boolean
  dir?: string
  loadOptions?: LoadOptions
}): Promise<unknown> {
  if (!options.dir && !options.loadOptions) {
    throw new CLIError('dir or loadOptions is required.')
  }

  if (options.development) {
    // In dev mode -> use ts-node and dev plugins
    process.env.NODE_ENV = 'development'
    settings.debug = true
  }

  return run(options.args ?? process.argv.slice(2), options.loadOptions ?? options.dir)
    .then(async (result) => {
      flush()
      return result
    })
    .catch(async (error) => handle(error))
}
