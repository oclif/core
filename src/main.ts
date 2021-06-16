import {fileURLToPath} from 'url'

import {format, inspect} from 'util'

import * as Interfaces from './interfaces'
import {Config} from './config'
import {loadHelpClass, standardizeIDFromArgv} from './help'

const log = (message = '', ...args: any[]) => {
  // tslint:disable-next-line strict-type-predicates
  message = typeof message === 'string' ? message : inspect(message)
  process.stdout.write(format(message, ...args) + '\n')
}

const helpOverride = (argv: string[], config: Interfaces.Config): boolean => {
  if (argv.length === 0 && !config.pjson.oclif.default) return true
  for (const arg of argv) {
    if (arg === '--help') return true
    if (arg === '--') return false
  }
  return false
}

const versionOverride = (argv: string[]): boolean => {
  if (['--version'].includes(argv[0])) return true
  return false
}

export async function run(argv = process.argv.slice(2), options?: Interfaces.LoadOptions) {
  // Handle the case when a file URL string or URL is passed in such as 'import.meta.url'; covert to file path.
  if ((typeof options === 'string' && options.startsWith('file://')) || options instanceof URL) {
    options = fileURLToPath(options)
  }

  // return Main.run(argv, options)
  const config = await Config.load(options || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname) as Config

  if (config.topicSeparator !== ':' && !argv[0].includes(':')) argv = standardizeIDFromArgv(argv, config)
  let [id, ...argvSlice] = argv
  // run init hook
  await config.runHook('init', {id, argv: argvSlice})

  // display version if applicable
  if (versionOverride(argv)) {
    log(config.userAgent)
    return
  }

  // display help version if applicable
  if (helpOverride(argv, config)) {
    argv = argv.filter(arg => {
      if (arg === '--help') return false
      return true
    })
    const Help = await loadHelpClass(config)
    const help = new Help(config, config.pjson.helpOptions)
    await help.showHelp(argv)
    return
  }

  // find & run command
  const cmd = config.findCommand(id)
  if (!cmd) {
    const topic = config.findTopic(id)
    if (topic) return config.runCommand('help', [id])
    if (config.pjson.oclif.default) {
      id = config.pjson.oclif.default
      argvSlice = argv
    }
  }
  await config.runCommand(id, argvSlice, cmd)
}
