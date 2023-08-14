import {fileURLToPath} from 'url'

import {format, inspect} from 'util'

import * as Interfaces from './interfaces'
import {URL} from 'url'
import {Config} from './config'
import {getHelpFlagAdditions, loadHelpClass, normalizeArgv} from './help'
import {settings} from './settings'
import {Errors, flush} from '.'
import {stdout} from './cli-ux/stream'
import {Performance} from './performance'

const debug = require('debug')('oclif:main')

const log = (message = '', ...args: any[]) => {
  message = typeof message === 'string' ? message : inspect(message)
  stdout.write(format(message, ...args) + '\n')
}

export const helpAddition = (argv: string[], config: Interfaces.Config): boolean => {
  if (argv.length === 0 && !config.pjson.oclif.default) return true
  const mergedHelpFlags = getHelpFlagAdditions(config)
  for (const arg of argv) {
    if (mergedHelpFlags.includes(arg)) return true
    if (arg === '--') return false
  }

  return false
}

export const versionAddition = (argv: string[], config?: Interfaces.Config): boolean => {
  const additionalVersionFlags = config?.pjson.oclif.additionalVersionFlags ?? []
  const mergedVersionFlags = [...new Set(['--version', ...additionalVersionFlags]).values()]
  if (mergedVersionFlags.includes(argv[0])) return true
  return false
}

export async function run(argv?: string[], options?: Interfaces.LoadOptions): Promise<unknown> {
  const marker = Performance.mark('main.run')

  const initMarker = Performance.mark('main.run#init')

  const collectPerf = async () => {
    marker?.stop()
    initMarker?.stop()
    await Performance.collect()
    Performance.debug()
  }

  debug(`process.execPath: ${process.execPath}`)
  debug(`process.execArgv: ${process.execArgv}`)
  debug('process.argv: %O', process.argv)

  argv = argv ?? process.argv.slice(2)
  // Handle the case when a file URL string or URL is passed in such as 'import.meta.url'; covert to file path.
  if (options && ((typeof options === 'string' && options.startsWith('file://')) || options instanceof URL)) {
    options = fileURLToPath(options)
  }

  const config = await Config.load(options ?? require.main?.filename ?? __dirname)

  let [id, ...argvSlice] = normalizeArgv(config, argv)
  // run init hook
  await config.runHook('init', {id, argv: argvSlice})

  // display version if applicable
  if (versionAddition(argv, config)) {
    log(config.userAgent)
    await collectPerf()
    return
  }

  // display help version if applicable
  if (helpAddition(argv, config)) {
    const Help = await loadHelpClass(config)
    const help = new Help(config, config.pjson.helpOptions)
    await help.showHelp(argv)
    await collectPerf()
    return
  }

  // find & run command
  const cmd = config.findCommand(id)
  if (!cmd) {
    const topic = config.flexibleTaxonomy ? null : config.findTopic(id)
    if (topic) return config.runCommand('help', [id])
    if (config.pjson.oclif.default) {
      id = config.pjson.oclif.default
      argvSlice = argv
    }
  }

  initMarker?.stop()

  // If the the default command is '.' (signifying that the CLI is a single command CLI) and '.' is provided
  // as an argument, we need to add back the '.' to argv since it was stripped out earlier as part of the
  // command id.
  if (config.pjson.oclif.default === '.' && id === '.' && argv[0] === '.') argvSlice = ['.', ...argvSlice]

  try {
    return await config.runCommand(id, argvSlice, cmd)
  } finally {
    await collectPerf()
  }
}

/**
 * Load and run oclif CLI
 *
 * @param options - options to load the CLI
 * @returns Promise<void>
 *
 * @example For ESM dev.js
 * ```
 * #!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
 * // eslint-disable-next-line node/shebang
 * (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({type: 'esm', development: true, dir: import.meta.url})
 * })()
 * ```
 *
 * @example For ESM run.js
 * ```
 * #!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
 * // eslint-disable-next-line node/shebang
 * (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({type: 'esm', dir: import.meta.url})
 * })()
 * ```
 *
 * @example For CJS dev.js
 * ```
 * #!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
 * // eslint-disable-next-line node/shebang
 * (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({type: 'cjs', development: true, dir: __dirname})
 * })()
 * ```
 *
 * @example For CJS run.js
 * ```
 * #!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
 * // eslint-disable-next-line node/shebang
 * (async () => {
 *   const oclif = await import('@oclif/core')
 *   await oclif.execute({type: 'cjs', dir: import.meta.url})
 * })()
 * ```
 */
export async function execute(
  options: {
    type: 'cjs' | 'esm';
    dir: string;
    args?: string[];
    loadOptions?: Interfaces.LoadOptions;
    development?: boolean;
  },
): Promise<void> {
  if (options.development) {
    // In dev mode -> use ts-node and dev plugins
    process.env.NODE_ENV = 'development'
    settings.debug = true
  }

  await run(options.args ?? process.argv.slice(2), options.loadOptions ?? options.dir)
  .then(async () => flush())
  .catch(Errors.handle)
}
