import * as _ from 'lodash'
import {Config as IConfig, HelpOptions} from '../interfaces'
import {Help, HelpBase} from '.'
import ModuleLoader from '../module-loader'

interface HelpBaseDerived {
  new(config: IConfig, opts?: Partial<HelpOptions>): HelpBase;
}

function extractClass(exported: any): HelpBaseDerived {
  return exported && exported.default ? exported.default : exported
}

export async function loadHelpClass(config: IConfig): Promise<HelpBaseDerived> {
  const pjson = config.pjson
  const configuredClass = pjson && pjson.oclif && pjson.oclif.helpClass

  if (configuredClass) {
    try {
      const exported = await ModuleLoader.load(config, configuredClass) as HelpBaseDerived
      return extractClass(exported) as HelpBaseDerived
    } catch (error: any) {
      throw new Error(`Unable to load configured help class "${configuredClass}", failed with message:\n${error.message}`)
    }
  }

  return Help
}

export function template(context: any): (t: string) => string {
  function render(t: string): string {
    return _.template(t)(context)
  }

  return render
}

function collateSpacedCmdIDFromArgs(argv: string[], config: IConfig): string[] {
  if (argv.length === 1) return argv

  const ids = new Set(config.commandIDs.concat(config.topics.map(t => t.name)))

  const findId = (argv: string[]): string | undefined => {
    const final: string[] = []
    const idPresent = (id: string) => ids.has(id)
    const isFlag = (s: string) => s.startsWith('-')
    const isArgWithValue = (s: string) => s.includes('=')
    const finalizeId = (s?: string) => s ? [...final, s].join(':') : final.join(':')

    const hasSubCommandsWithArgs = () => {
      const id = finalizeId()
      /**
       * Get a list of sub commands for the current command id. A command is returned as a subcommand under either
       * of these conditions:
       * 1. the `id` start with the current command id.
       * 2. any of the aliases start with the current command id.
       */
      const subCommands = config.commands.filter(c => (c.id).startsWith(id) || c.aliases.some(a => a.startsWith(id)))
      return Boolean(subCommands.find(cmd => cmd.strict === false || cmd.args?.length > 0))
    }

    for (const arg of argv) {
      if (idPresent(finalizeId(arg))) final.push(arg)
      // If the parent topic has a command that expects positional arguments, then we cannot
      // assume that any subsequent string could be part of the command name
      else if (isArgWithValue(arg) || isFlag(arg) || hasSubCommandsWithArgs()) break
      else final.push(arg)
    }

    return finalizeId()
  }

  const id = findId(argv)

  if (id) {
    const argvSlice = argv.slice(id.split(':').length)
    return [id, ...argvSlice]
  }

  return argv // ID is argv[0]
}

export function toStandardizedId(commandID: string, config: IConfig): string {
  return commandID.replace(new RegExp(config.topicSeparator, 'g'), ':')
}

export function toConfiguredId(commandID: string, config: IConfig): string {
  const defaultTopicSeperator = ':'
  return commandID.replace(new RegExp(defaultTopicSeperator, 'g'), config.topicSeparator || defaultTopicSeperator)
}

export function standardizeIDFromArgv(argv: string[], config: IConfig): string[] {
  if (argv.length === 0) return argv
  if (config.topicSeparator === ' ') argv = collateSpacedCmdIDFromArgs(argv, config)
  else if (config.topicSeparator !== ':') argv[0] = toStandardizedId(argv[0], config)
  return argv
}
