import {format, inspect} from 'util'

import * as Interfaces from './interfaces'
import {Config} from './config'
import {getHelpClass, standarizeIDFromArgv} from './help'
import {Arg} from './interfaces'

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
  // return Main.run(argv, options)
  const config = await Config.load(options || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname) as Config

  // run init hook
  if (config.topicSeparator !== ':') argv = standarizeIDFromArgv(argv, config)
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
      if (arg === '--help') return false
      return true
    })
    const Help = getHelpClass(config)
    const help = new Help(config)
    help.showHelp(argv)
    return
  }

  // find & run command
  const cmd = config.findCommand(id)
  if (!cmd) {
    const topic = config.findTopic(id)
    if (topic) {
      const subCommands = config.commands.filter(c => (c.id).startsWith(id))
      const argsOfSubCommands = subCommands.reduce((x, y) => x.concat(y.args), [] as Arg[])

      if (argsOfSubCommands.length > 0) return config.runCommand('help', [id])
      if (argvSlice[0].startsWith('--')) return config.runCommand('help', [id])

      const extraBits = []
      for (const arg of argvSlice) {
        if (arg.startsWith('--')) {
          break
        } else {
          extraBits.push(arg)
        }
      }
      id = [id, ...extraBits].join(':')
      argvSlice = argvSlice.slice(extraBits.length)
    }
    if (config.pjson.oclif.default) {
      id = config.pjson.oclif.default
      argvSlice = argv
    }
  }
  await config.runCommand(id, argvSlice, cmd)
}
