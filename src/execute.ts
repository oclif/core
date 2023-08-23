import settings from './settings'
import flush from './cli-ux/flush'
import handle from './errors/handle'
import run from './main'
import * as Interfaces from './interfaces'

/**
 * Load and run oclif CLI
 *
 * @param options - options to load the CLI
 * @returns Promise<void>
 *
 * @example For ESM dev.js
 * ```
 * #!/usr/bin/env node
 * void (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({development: true, dir: import.meta.url})
 * })()
 * ```
 *
 * @example For ESM run.js
 * ```
 * #!/usr/bin/env node
 * void (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({dir: import.meta.url})
 * })()
 * ```
 *
 * @example For CJS dev.js
 * ```
 * #!/usr/bin/env node
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
export default async function execute(
  options: {
    dir: string;
    args?: string[];
    loadOptions?: Interfaces.LoadOptions;
    development?: boolean;
  },
): Promise<unknown> {
  if (options.development) {
    // In dev mode -> use ts-node and dev plugins
    process.env.NODE_ENV = 'development'
    settings.debug = true
  }

  return run(options.args ?? process.argv.slice(2), options.loadOptions ?? options.dir)
  .then(async result => {
    flush()
    return result
  })
  .catch(async error => handle(error))
}
