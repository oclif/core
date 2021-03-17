import lodashTemplate = require('lodash.template')

import {Config as IConfig, HelpOptions} from '../interfaces'
import {Help, HelpBase} from '.'
import ModuleLoader from '../module-loader'

interface HelpBaseDerived {
  new(config: IConfig, opts?: Partial<HelpOptions>): HelpBase;
}

function extractClass(exported: any): HelpBaseDerived {
  return exported && exported.default ? exported.default : exported
}

export async function getHelpClass(config: IConfig): Promise<HelpBaseDerived> {
  const pjson = config.pjson
  const configuredClass = pjson && pjson.oclif && pjson.oclif.helpClass

  if (configuredClass) {
    try {
      const exported = await ModuleLoader.load(config, configuredClass) as HelpBaseDerived
      return extractClass(exported) as HelpBaseDerived
    } catch (error) {
      throw new Error(`Unable to load configured help class "${configuredClass}", failed with message:\n${error.message}`)
    }
  }

  return Help
}

export function template(context: any): (t: string) => string {
  function render(t: string): string {
    return lodashTemplate(t)(context)
  }
  return render
}

function collateSpacedCmdIDFromArgs(argv: string[], config: IConfig): string[] {
  if (argv.length === 1) return argv

  const ids = config.commandIDs.concat(config.topics.map(t => t.name))

  const findId = (id: string, next: string[]): string | undefined => {
    const idPresnet = (id: string) => ids.includes(id)
    if (idPresnet(id) && !idPresnet(`${id}:${next[0]}`)) return id
    if (next.length === 0 || next[0] === '--') return
    return findId(`${id}:${next[0]}`, next.slice(1))
  }

  const id = findId(argv[0], argv.slice(1))

  if (id) {
    const argvSlice = argv.slice(id.split(':').length)
    return [id, ...argvSlice]
  }

  return argv // ID is argv[0]
}

export function standarizeIDFromArgv(argv: string[], config: IConfig): string[] {
  if (argv.length === 0) return argv
  if (config.topicSeparator === ' ') argv = collateSpacedCmdIDFromArgs(argv, config)
  else if (config.topicSeparator !== ':') argv[0] = argv[0].replace(new RegExp(config.topicSeparator, 'g'), ':')
  return argv
}
