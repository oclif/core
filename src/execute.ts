import {flush} from './cli-ux/flush'
import {handle} from './errors/handle'
import {LoadOptions} from './interfaces'
import {run} from './main'
import {settings} from './settings'

/**
 * Load and run oclif CLI
 *
 * @param options - options to load the CLI
 * @returns Promise<void>
 *
 * @example For ESM dev.js
 * ```
 * #!/usr/bin/env ts-node
 * async function main() {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({development: true, dir: import.meta.url})
 * }
 *
 * await main()
 * ```
 *
 * @example For ESM run.js
 * ```
 * #!/usr/bin/env node
 * async function main() {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({dir: import.meta.url})
 * }
 *
 * await main()
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
  dir: string
  loadOptions?: LoadOptions
}): Promise<unknown> {
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
