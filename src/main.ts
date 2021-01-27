import {format, inspect} from 'util'

import * as Interfaces from './interfaces'
import {Config} from './config'
import {getHelpClass} from './help'

const ROOT_INDEX_CMD_ID = ''

const log = (message = '', ...args: any[]) => {
  // tslint:disable-next-line strict-type-predicates
  message = typeof message === 'string' ? message : inspect(message)
  process.stdout.write(format(message, ...args) + '\n')
}

const helpOverride = (argv: string[], config: Interfaces.Config): boolean => {
  if (['-h', 'help'].includes(argv[0])) return true
  if (argv.length === 0 && !config.findCommand(ROOT_INDEX_CMD_ID)) return true
  for (const arg of argv) {
    if (arg === '--help') return true
    if (arg === '--') return false
  }
  return false
}

const versionOverride = (argv: string[]): boolean => {
  if (['-v', '--version', 'version'].includes(argv[0])) return true
  return false
}

export async function run(argv = process.argv.slice(2), options?: Interfaces.LoadOptions) {
  // return Main.run(argv, options)
  const config = await Config.load(options || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname) as Config

  // run init hook
  let [id, ...argvSlice] = argv
  await config.runHook('init', {id, argv: argvSlice})

  // display version if applicable
  if (versionOverride(argv)) {
    log(config.userAgent)
    return
  }

  // display help version if applicable
  if (helpOverride(argv, config)) {
    argv = argv.filter(arg => {
      if (arg === 'help') return false
      if (arg === '--help') return false
      if (arg === '-h') return false
      return true
    })
    const Help = getHelpClass(config)
    const help = new Help(config)
    const helpArgv = config.findCommand(ROOT_INDEX_CMD_ID) ? ['', ...argv] : argv
    help.showHelp(helpArgv)
    return
  }

  // find & run command
  if (!config.findCommand(id)) {
    const topic = config.findTopic(id)
    if (topic) return config.runCommand('help', [id])
    if (config.findCommand(ROOT_INDEX_CMD_ID)) {
      id = ROOT_INDEX_CMD_ID
      argvSlice = argv
    }
  }
  await config.runCommand(id, argvSlice)
}
