import {boolean} from '../flags'
import {FlagInput, FlagOutput} from '../interfaces/parser'

const json = boolean({
  description: 'Format output as json.',
  helpGroup: 'GLOBAL',
})

export function aggregateFlags<F extends FlagOutput>(
  flags: FlagInput<F> | undefined,
  enableJsonFlag: boolean | undefined,
): FlagInput<F> {
  return (enableJsonFlag ? {json, ...flags} : flags) as FlagInput<F>
}
