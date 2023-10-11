import {Command} from '../command'
import {ArgInput, FlagInput} from '../interfaces/parser'
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
      aliases: flag.aliases,
      char: flag.char,
      charAliases: flag.charAliases,
      dependsOn: flag.dependsOn,
      deprecateAliases: flag.deprecateAliases,
      deprecated: flag.deprecated,
      description: flag.description,
      exclusive: flag.exclusive,
      helpGroup: flag.helpGroup,
      helpLabel: flag.helpLabel,
      hidden: flag.hidden,
      name,
      noCacheDefault: flag.noCacheDefault,
      relationships: flag.relationships,
      required: flag.required,
      summary: flag.summary,
      ...(flag.type === 'boolean'
        ? {
            allowNo: flag.allowNo,
            type: flag.type,
          }
        : {
            default: await cacheDefaultValue(flag, respectNoCacheDefault),
            delimiter: flag.delimiter,
            hasDynamicHelp: typeof flag.defaultHelp === 'function',
            helpValue: flag.helpValue,
            multiple: flag.multiple,
            options: flag.options,
            type: flag.type,
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
      default: await cacheDefaultValue(arg, respectNoCacheDefault),
      description: arg.description,
      hidden: arg.hidden,
      name,
      noCacheDefault: arg.noCacheDefault,
      options: arg.options,
      required: arg.required,
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

  // @ts-expect-error because v2 commands have flags stored in _flags
  const uncachedFlags = cmd.flags ?? cmd._flags
  // @ts-expect-error because v2 commands have base flags stored in _baseFlags
  const uncachedBaseFlags = cmd.baseFlags ?? cmd._baseFlags

  const flags = await cacheFlags(
    aggregateFlags(uncachedFlags, uncachedBaseFlags, cmd.enableJsonFlag),
    respectNoCacheDefault,
  )
  const args = await cacheArgs(ensureArgObject(cmd.args), respectNoCacheDefault)

  const stdProperties = {
    aliases: cmd.aliases || [],
    args,
    deprecateAliases: cmd.deprecateAliases,
    deprecationOptions: cmd.deprecationOptions,
    description: cmd.description,
    examples: cmd.examples || (cmd as any).example,
    flags,
    hasDynamicHelp: Object.values(flags).some((f) => f.hasDynamicHelp),
    hidden: cmd.hidden,
    id: cmd.id,
    pluginAlias: plugin && plugin.alias,
    pluginName: plugin && plugin.name,
    pluginType: plugin && plugin.type,
    state: cmd.state,
    strict: cmd.strict,
    summary: cmd.summary,
    usage: cmd.usage,
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
