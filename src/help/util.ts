import * as ejs from 'ejs'
import {Config as IConfig, HelpOptions, Deprecation} from '../interfaces'
import {Help, HelpBase} from '.'
import {load} from '../module-loader'
import {collectUsableIds} from '../config/util'

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
      const exported = await load(config, configuredClass) as HelpBaseDerived
      return extractClass(exported) as HelpBaseDerived
    } catch (error: any) {
      throw new Error(`Unable to load configured help class "${configuredClass}", failed with message:\n${error.message}`)
    }
  }

  return Help
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function template(context: any): (t: string) => string {
  function render(t: string): string {
    return ejs.render(t, context)
  }

  return render
}

const isFlag = (s: string) => s.startsWith('-')
const isArgWithValue = (s: string) => s.includes('=')

function collateSpacedCmdIDFromArgs(argv: string[], config: IConfig): string[] {
  if (argv.length === 1) return argv

  const findId = (argv: string[]): string | undefined => {
    const ids = collectUsableIds(config.commandIDs)

    const final: string[] = []
    const idPresent = (id: string) => ids.has(id)
    const finalizeId = (s?: string) => s ? [...final, s].join(':') : final.join(':')

    const hasArgs = () => {
      const id = finalizeId()
      if (!id) return false
      const cmd = config.findCommand(id)
      return Boolean(cmd && (cmd.strict === false || Object.keys(cmd.args ?? {}).length > 0))
    }

    for (const arg of argv) {
      if (idPresent(finalizeId(arg))) final.push(arg)
      // If the parent topic has a command that expects positional arguments, then we cannot
      // assume that any subsequent string could be part of the command name
      else if (isArgWithValue(arg) || isFlag(arg) || hasArgs()) break
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
  const defaultTopicSeparator = ':'
  return commandID.replace(new RegExp(defaultTopicSeparator, 'g'), config.topicSeparator || defaultTopicSeparator)
}

export function standardizeIDFromArgv(argv: string[], config: IConfig): string[] {
  if (argv.length === 0) return argv
  if (config.topicSeparator === ' ') argv = collateSpacedCmdIDFromArgs(argv, config)
  else if (config.topicSeparator !== ':') argv[0] = toStandardizedId(argv[0], config)
  return argv
}

export function getHelpFlagAdditions(config: IConfig): string[] {
  const helpFlags = ['--help']
  const additionalHelpFlags = config.pjson.oclif.additionalHelpFlags ?? []
  return [...new Set([...helpFlags, ...additionalHelpFlags]).values()]
}

export function formatFlagDeprecationWarning(flag: string, opts: true | Deprecation): string {
  let message = `The "${flag}" flag has been deprecated`
  if (opts === true) return `${message}.`
  if (opts.message) return opts.message

  if (opts.version) {
    message += ` and will be removed in version ${opts.version}`
  }

  message += opts.to ? `. Use "${opts.to}" instead.` : '.'

  return message
}

export function formatCommandDeprecationWarning(command: string, opts?: Deprecation): string {
  let message = `The "${command}" command has been deprecated`
  if (!opts) return `${message}.`

  if (opts.message) return opts.message

  if (opts.version) {
    message += ` and will be removed in version ${opts.version}`
  }

  message += opts.to ? `. Use "${opts.to}" instead.` : '.'

  return message
}

export function normalizeArgv(config: IConfig, argv = process.argv.slice(2)): string[] {
  if (config.topicSeparator !== ':' && !argv[0]?.includes(':')) argv = standardizeIDFromArgv(argv, config)
  return argv
}
