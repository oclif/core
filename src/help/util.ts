import {tsPath} from '@oclif/config/lib/ts-node'
import lodashTemplate = require('lodash.template')
import {IConfig} from '@oclif/config'
import {HelpBase, HelpOptions} from '.'

export function uniqBy<T>(arr: T[], fn: (cur: T) => any): T[] {
  return arr.filter((a, i) => {
    const aVal = fn(a)
    return !arr.find((b, j) => j > i && fn(b) === aVal)
  })
}

export function compact<T>(a: (T | undefined)[]): T[] {
  return a.filter((a): a is T => Boolean(a))
}

export function castArray<T>(input?: T | T[]): T[] {
  if (input === undefined) return []
  return Array.isArray(input) ? input : [input]
}

export function sortBy<T>(arr: T[], fn: (i: T) => sort.Types | sort.Types[]): T[] {
  function compare(a: sort.Types | sort.Types[], b: sort.Types | sort.Types[]): number {
    a = a === undefined ? 0 : a
    b = b === undefined ? 0 : b

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === 0 && b.length === 0) return 0
      const diff = compare(a[0], b[0])
      if (diff !== 0) return diff
      return compare(a.slice(1), b.slice(1))
    }

    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  return arr.sort((a, b) => compare(fn(a), fn(b)))
}

export namespace sort {
  export type Types = string | number | undefined | boolean
}

export function template(context: any): (t: string) => string {
  function render(t: string): string {
    return lodashTemplate(t)(context)
  }
  return render
}

interface HelpBaseDerived {
  new(config: IConfig, opts?: Partial<HelpOptions>): HelpBase;
}

function extractExport(config: IConfig, classPath: string): HelpBaseDerived {
  const helpClassPath = tsPath(config.root, classPath)
  return require(helpClassPath) as HelpBaseDerived
}

function extractClass(exported: any): HelpBaseDerived {
  return exported && exported.default ? exported.default : exported
}

export function getHelpClass(config: IConfig, defaultClass = '@oclif/plugin-help'): HelpBaseDerived {
  const pjson = config.pjson
  const configuredClass = pjson && pjson.oclif &&  pjson.oclif.helpClass

  if (configuredClass) {
    try {
      const exported = extractExport(config, configuredClass)
      return extractClass(exported) as HelpBaseDerived
    } catch (error) {
      throw new Error(`Unable to load configured help class "${configuredClass}", failed with message:\n${error.message}`)
    }
  }

  try {
    const defaultModulePath = require.resolve(defaultClass, {paths: [config.root]})
    const exported = require(defaultModulePath)
    return extractClass(exported) as HelpBaseDerived
  } catch (error) {
    throw new Error(`Could not load a help class, consider installing the @oclif/plugin-help package, failed with message:\n${error.message}`)
  }
}
