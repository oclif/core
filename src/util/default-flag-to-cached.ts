import {OptionFlag} from '../interfaces/parser'

// when no manifest exists, the default is calculated.  This may throw, so we need to catch it
export const defaultFlagToCached = async (flag: OptionFlag<any>, respectNoCacheDefault: boolean) => {
  if (respectNoCacheDefault && flag.noCacheDefault) return
  // Prefer the defaultHelp function (returns a friendly string for complex types)
  if (typeof flag.defaultHelp === 'function') {
    try {
      return await flag.defaultHelp({options: flag, flags: {}})
    } catch {
      return
    }
  }

  // if not specified, try the default function
  if (typeof flag.default === 'function') {
    try {
      return await flag.default({options: flag, flags: {}})
    } catch {}
  } else {
    return flag.default
  }
}
