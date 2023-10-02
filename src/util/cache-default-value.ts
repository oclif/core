import {Arg, OptionFlag} from '../interfaces/parser'

// when no manifest exists, the default is calculated.  This may throw, so we need to catch it
export const cacheDefaultValue = async (flagOrArg: OptionFlag<any> | Arg<any>, respectNoCacheDefault: boolean) => {
  if (respectNoCacheDefault && flagOrArg.noCacheDefault) return
  // Prefer the defaultHelp function (returns a friendly string for complex types)
  if (typeof flagOrArg.defaultHelp === 'function') {
    try {
      return await flagOrArg.defaultHelp({options: flagOrArg, flags: {}})
    } catch {
      return
    }
  }

  // if not specified, try the default function
  if (typeof flagOrArg.default === 'function') {
    try {
      return await flagOrArg.default({options: flagOrArg, flags: {}})
    } catch {}
  } else {
    return flagOrArg.default
  }
}
