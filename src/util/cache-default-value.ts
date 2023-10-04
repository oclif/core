import {Arg, OptionFlag} from '../interfaces/parser'

// when no manifest exists, the default is calculated.  This may throw, so we need to catch it
export const cacheDefaultValue = async (flagOrArg: Arg<any> | OptionFlag<any>, respectNoCacheDefault: boolean) => {
  if (respectNoCacheDefault && flagOrArg.noCacheDefault) return
  // Prefer the defaultHelp function (returns a friendly string for complex types)
  if (typeof flagOrArg.defaultHelp === 'function') {
    try {
      return await flagOrArg.defaultHelp({flags: {}, options: flagOrArg})
    } catch {
      return
    }
  }

  // if not specified, try the default function
  if (typeof flagOrArg.default === 'function') {
    try {
      return await flagOrArg.default({flags: {}, options: flagOrArg})
    } catch {}
  } else {
    return flagOrArg.default
  }
}
