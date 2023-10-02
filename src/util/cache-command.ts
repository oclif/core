import {ArgInput, FlagInput} from '../interfaces/parser'
import {Command} from '../command'
import {Plugin as IPlugin} from '../interfaces/plugin'
import {aggregateFlags} from './aggregate-flags'
import {cacheDefaultValue} from './cache-default-value'
import {ensureArgObject} from './ensure-arg-object'
import {pickBy} from './util'

// In order to collect static properties up the inheritance chain, we need to recursively
// access the prototypes until there's nothing left. This allows us to combine baseFlags
// and flags as well as add in the json flag if enableJsonFlag is enabled.
function mergePrototype(result: Command.Class, cmd: Command.Class): Command.Class {
  const proto = Object.getPrototypeOf(cmd)
  const filteredProto = pickBy(proto, (v) => v !== undefined) as Command.Class
  return Object.keys(proto).length > 0 ? mergePrototype({...filteredProto, ...result} as Command.Class, proto) : result
}

async function cacheFlags(
  cmdFlags: FlagInput<any>,
  respectNoCacheDefault: boolean,
): Promise<Record<string, Command.Flag.Cached>> {
  const promises = Object.entries(cmdFlags).map(async ([name, flag]) => [
    name,
    {
      name,
      char: flag.char,
      summary: flag.summary,
      hidden: flag.hidden,
      required: flag.required,
      helpLabel: flag.helpLabel,
      helpGroup: flag.helpGroup,
      description: flag.description,
      dependsOn: flag.dependsOn,
      relationships: flag.relationships,
      exclusive: flag.exclusive,
      deprecated: flag.deprecated,
      deprecateAliases: flag.deprecateAliases,
      aliases: flag.aliases,
      charAliases: flag.charAliases,
      noCacheDefault: flag.noCacheDefault,
      ...(flag.type === 'boolean'
        ? {
            allowNo: flag.allowNo,
            type: flag.type,
          }
        : {
            type: flag.type,
            helpValue: flag.helpValue,
            multiple: flag.multiple,
            options: flag.options,
            delimiter: flag.delimiter,
            default: await cacheDefaultValue(flag, respectNoCacheDefault),
            hasDynamicHelp: typeof flag.defaultHelp === 'function',
          }),
    },
  ])
  return Object.fromEntries(await Promise.all(promises))
}

async function cacheArgs(
  cmdArgs: ArgInput<any>,
  respectNoCacheDefault: boolean,
): Promise<Record<string, Command.Arg.Cached>> {
  const promises = Object.entries(cmdArgs).map(async ([name, arg]) => [
    name,
    {
      name,
      description: arg.description,
      required: arg.required,
      options: arg.options,
      default: await cacheDefaultValue(arg, respectNoCacheDefault),
      hidden: arg.hidden,
      noCacheDefault: arg.noCacheDefault,
    },
  ])
  return Object.fromEntries(await Promise.all(promises))
}

export async function cacheCommand(
  uncachedCmd: Command.Class,
  plugin?: IPlugin,
  respectNoCacheDefault = false,
): Promise<Command.Cached> {
  const cmd = mergePrototype(uncachedCmd, uncachedCmd)

  const flags = await cacheFlags(aggregateFlags(cmd.flags, cmd.baseFlags, cmd.enableJsonFlag), respectNoCacheDefault)
  const args = await cacheArgs(ensureArgObject(cmd.args), respectNoCacheDefault)

  const stdProperties = {
    id: cmd.id,
    summary: cmd.summary,
    description: cmd.description,
    strict: cmd.strict,
    usage: cmd.usage,
    pluginName: plugin && plugin.name,
    pluginAlias: plugin && plugin.alias,
    pluginType: plugin && plugin.type,
    hidden: cmd.hidden,
    state: cmd.state,
    aliases: cmd.aliases || [],
    examples: cmd.examples || (cmd as any).example,
    deprecationOptions: cmd.deprecationOptions,
    deprecateAliases: cmd.deprecateAliases,
    flags,
    args,
    hasDynamicHelp: Object.values(flags).some((f) => f.hasDynamicHelp),
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

  // Add in any additional properties that are not standard command properties.
  const stdKeysAndIgnored = new Set([...Object.keys(stdProperties), ...ignoreCommandProperties])
  const keysToAdd = Object.keys(cmd).filter((property) => !stdKeysAndIgnored.has(property))
  const additionalProperties = Object.fromEntries(keysToAdd.map((key) => [key, (cmd as any)[key]]))

  return {...stdProperties, ...additionalProperties}
}
