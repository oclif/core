import {fileURLToPath, URL} from 'node:url'

import Cache from './cache'
import {Config} from './config'
import {getHelpFlagAdditions, loadHelpClass, normalizeArgv} from './help'
import * as Interfaces from './interfaces'
import {getLogger, setLogger} from './logger'
import {OCLIF_MARKER_OWNER, Performance} from './performance'
import {SINGLE_COMMAND_CLI_SYMBOL} from './symbols'
import {ux} from './ux'

export const helpAddition = (argv: string[], config: Interfaces.Config): boolean => {
  if (argv.length === 0 && !config.isSingleCommandCLI) return true
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
  const marker = Performance.mark(OCLIF_MARKER_OWNER, 'main.run')

  const initMarker = Performance.mark(OCLIF_MARKER_OWNER, 'main.run#init')

  const showHelp = async (argv: string[]) => {
    const Help = await loadHelpClass(config)
    const help = new Help(config, config.pjson.oclif.helpOptions ?? config.pjson.helpOptions)
    await help.showHelp(argv)
  }

  setLogger(options)

  const {debug} = getLogger('main')
  debug(`process.execPath: ${process.execPath}`)
  debug(`process.execArgv: ${process.execArgv}`)
  debug('process.argv: %O', process.argv)

  argv = argv ?? process.argv.slice(2)
  // Handle the case when a file URL string or URL is passed in such as 'import.meta.url'; covert to file path.
  if (options && ((typeof options === 'string' && options.startsWith('file://')) || options instanceof URL)) {
    options = fileURLToPath(options)
  }

  const config = await Config.load(options ?? require.main?.filename ?? __dirname)
  Cache.getInstance().set('config', config)
  // If this is a single command CLI, then insert the SINGLE_COMMAND_CLI_SYMBOL into the argv array to serve as the command id.
  if (config.isSingleCommandCLI) {
    argv = [SINGLE_COMMAND_CLI_SYMBOL, ...argv]
  }

  const [id, ...argvSlice] = normalizeArgv(config, argv)

  const runFinally = async () => {
    marker?.stop()
    if (!initMarker?.stopped) initMarker?.stop()
    await Performance.collect()
    Performance.debug()
    await config.runHook('finally', {argv: argvSlice, id})
  }

  // run init hook
  await config.runHook('init', {argv: argvSlice, id})

  // display version if applicable
  if (versionAddition(argv, config)) {
    ux.stdout(config.userAgent)
    await runFinally()
    return
  }

  // display help version if applicable
  if (helpAddition(argv, config)) {
    await showHelp(argv)
    await runFinally()
    return
  }

  // find & run command
  const cmd = config.findCommand(id)
  if (!cmd) {
    const topic = config.flexibleTaxonomy ? null : config.findTopic(id)
    if (topic) {
      await showHelp([id])
      await runFinally()
      return
    }
  }

  initMarker?.stop()

  try {
    return await config.runCommand(id, argvSlice, cmd)
  } finally {
    await runFinally()
  }
}
