import {fileURLToPath} from 'url'

import {format, inspect} from 'util'

import * as Interfaces from './interfaces'
import {URL} from 'url'
import {Config} from './config'
import {getHelpFlagAdditions, loadHelpClass, standardizeIDFromArgv} from './help'

const log = (message = '', ...args: any[]) => {
  message = typeof message === 'string' ? message : inspect(message)
  process.stdout.write(format(message, ...args) + '\n')
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

export async function run(argv?: string[], options?: Interfaces.LoadOptions): Promise<void> {
  argv = argv ?? process.argv.slice(2)
  // Handle the case when a file URL string or URL is passed in such as 'import.meta.url'; covert to file path.
  if (options && ((typeof options === 'string' && options.startsWith('file://')) || options instanceof URL)) {
    options = fileURLToPath(options)
  }

  const config = await Config.load(options ?? require.main?.filename ?? __dirname)

  if (config.topicSeparator !== ':' && !argv[0]?.includes(':')) argv = standardizeIDFromArgv(argv, config)
  let [id, ...argvSlice] = argv
  // run init hook
  await config.runHook('init', {id, argv: argvSlice})

  // display version if applicable
  if (versionAddition(argv, config)) {
    log(config.userAgent)
    return
  }

  // display help version if applicable
  if (helpAddition(argv, config)) {
    const Help = await loadHelpClass(config)
    const help = new Help(config, config.pjson.helpOptions)
    await help.showHelp(argv)
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

  // If the the default command is '.' (signifying that the CLI is a single command CLI) and '.' is provided
  // as an argument, we need to add back the '.' to argv since it was stripped out earlier as part of the
  // command id.
  if (config.pjson.oclif.default === '.' && id === '.' && argv[0] === '.') argvSlice = ['.', ...argvSlice]
  await config.runCommand(id, argvSlice, cmd)
}
