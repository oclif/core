import {FlagInput, FlagOutput} from '../interfaces/parser'
import {boolean} from '../flags'

const json = boolean({
  description: 'Format output as json.',
  helpGroup: 'GLOBAL',
})

export function aggregateFlags<F extends FlagOutput, B extends FlagOutput>(
  flags: FlagInput<F> | undefined,
  baseFlags: FlagInput<B> | undefined,
  enableJsonFlag: boolean | undefined,
): FlagInput<F> {
  const combinedFlags = {...baseFlags, ...flags}
  return (enableJsonFlag
    ? {json, ...combinedFlags}
    : combinedFlags) as FlagInput<F>
}
