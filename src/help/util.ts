import lodashTemplate = require('lodash.template')

import {Config as IConfig} from '../interfaces/config'
import {Help, HelpBase, HelpOptions} from '.'
import * as Config from '../config'

interface HelpBaseDerived {
  new(config: IConfig, opts?: Partial<HelpOptions>): HelpBase;
}

function extractExport(config: IConfig, classPath: string): HelpBaseDerived {
  const helpClassPath = Config.tsPath(config.root, classPath)
  return require(helpClassPath) as HelpBaseDerived
}

function extractClass(exported: any): HelpBaseDerived {
  return exported && exported.default ? exported.default : exported
}

export function getHelpClass(config: IConfig): HelpBaseDerived {
  const pjson = config.pjson
  const configuredClass = pjson && pjson.oclif && pjson.oclif.helpClass

  if (configuredClass) {
    try {
      const exported = extractExport(config, configuredClass)
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
