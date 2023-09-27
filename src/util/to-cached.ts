/* eslint-disable no-await-in-loop */
import {ensureArgObject, pickBy} from './index'
import {Arg} from '../interfaces/parser'
import {Command} from '../command'
import {Plugin as IPlugin} from '../interfaces/plugin'
import {defaultFlagToCached} from './default-flag-to-cached'
import {json} from '../flags'

const defaultArgToCached = async (arg: Arg<any>, respectNoCacheDefault: boolean): Promise<any> => {
  if (respectNoCacheDefault && arg.noCacheDefault) return
  // Prefer the defaultHelp function (returns a friendly string for complex types)
  if (typeof arg.defaultHelp === 'function') {
    try {
      return await arg.defaultHelp({options: arg, flags: {}})
    } catch {
      return
    }
  }

  // if not specified, try the default function
  if (typeof arg.default === 'function') {
    try {
      return await arg.default({options: arg, flags: {}})
    } catch {}
  } else {
    return arg.default
  }
}

export async function toCached(cmd: Command.Class, plugin?: IPlugin, respectNoCacheDefault = false): Promise<Command.Cached> {
  const flags = {} as {[k: string]: Command.Flag.Cached}

  // In order to collect static properties up the inheritance chain, we need to recursively
  // access the prototypes until there's nothing left. This allows us to combine baseFlags
  // and flags as well as add in the json flag if enableJsonFlag is enabled.
  const mergePrototype = (result: Command.Class, cmd: Command.Class): Command.Class => {
    const proto = Object.getPrototypeOf(cmd)
    const filteredProto = pickBy(proto, v => v !== undefined) as Command.Class
    return Object.keys(proto).length > 0 ? mergePrototype({...filteredProto, ...result} as Command.Class, proto) : result
  }

  const c = mergePrototype(cmd, cmd)

  const cmdFlags = {
    ...(c.enableJsonFlag ? {json: json()} : {}),
    ...c.baseFlags,
    ...c.flags,
  } as typeof c['flags']

  for (const [name, flag] of Object.entries(cmdFlags || {})) {
    if (flag.type === 'boolean') {
      flags[name] = {
        name,
        type: flag.type,
        char: flag.char,
        summary: flag.summary,
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required,
        helpLabel: flag.helpLabel,
        helpGroup: flag.helpGroup,
        allowNo: flag.allowNo,
        dependsOn: flag.dependsOn,
        relationships: flag.relationships,
        exclusive: flag.exclusive,
        deprecated: flag.deprecated,
        deprecateAliases: c.deprecateAliases,
        aliases: flag.aliases,
        charAliases: flag.charAliases,
        delimiter: flag.delimiter,
        noCacheDefault: flag.noCacheDefault,
      }
    } else {
      flags[name] = {
        name,
        type: flag.type,
        char: flag.char,
        summary: flag.summary,
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required,
        helpLabel: flag.helpLabel,
        helpValue: flag.helpValue,
        helpGroup: flag.helpGroup,
        multiple: flag.multiple,
        options: flag.options,
        dependsOn: flag.dependsOn,
        relationships: flag.relationships,
        exclusive: flag.exclusive,
        default: await defaultFlagToCached(flag, respectNoCacheDefault),
        deprecated: flag.deprecated,
        deprecateAliases: c.deprecateAliases,
        aliases: flag.aliases,
        charAliases: flag.charAliases,
        delimiter: flag.delimiter,
        noCacheDefault: flag.noCacheDefault,
      }
      // a command-level placeholder in the manifest so that oclif knows it should regenerate the command during help-time
      if (typeof flag.defaultHelp === 'function') {
        c.hasDynamicHelp = true
      }
    }
  }

  const args = {} as {[k: string]: Command.Arg.Cached}
  for (const [name, arg] of Object.entries(ensureArgObject(c.args))) {
    args[name] = {
      name,
      description: arg.description,
      required: arg.required,
      options: arg.options,
      default: await defaultArgToCached(arg, respectNoCacheDefault),
      hidden: arg.hidden,
      noCacheDefault: arg.noCacheDefault,
    }
  }

  const stdProperties = {
    id: c.id,
    summary: c.summary,
    description: c.description,
    strict: c.strict,
    usage: c.usage,
    pluginName: plugin && plugin.name,
    pluginAlias: plugin && plugin.alias,
    pluginType: plugin && plugin.type,
    hidden: c.hidden,
    state: c.state,
    aliases: c.aliases || [],
    examples: c.examples || (c as any).example,
    deprecationOptions: c.deprecationOptions,
    deprecateAliases: c.deprecateAliases,
    flags,
    args,
  }

  // do not include these properties in manifest
  const ignoreCommandProperties = [
    'plugin',
    '_flags',
    '_enableJsonFlag',
    '_globalFlags',
    '_baseFlags',
    'baseFlags',
    '_--',
    '_base',
  ]
  const stdKeys = Object.keys(stdProperties)
  const keysToAdd = Object.keys(c).filter(property => ![...stdKeys, ...ignoreCommandProperties].includes(property))
  const additionalProperties: Record<string, unknown> = {}
  for (const key of keysToAdd) {
    additionalProperties[key] = (c as any)[key]
  }

  return {...stdProperties, ...additionalProperties}
}
