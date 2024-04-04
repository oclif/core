import {getLogger} from '../logger'

if (process.listenerCount('warning') === 1) {
  process.on('warning', (warning: any) => {
    console.error(warning.stack)
    if (warning.detail) console.error(warning.detail)
  })
}

export function makeDebug(...scope: string[]): (..._: any) => void {
  return (formatter: unknown, ...args: unknown[]) => getLogger(['config', ...scope].join(':')).debug(formatter, ...args)
}

// Adapted from https://github.com/angus-c/just/blob/master/packages/array-permutations/index.js
export function getPermutations(arr: string[]): Array<string[]> {
  if (arr.length === 0) return []
  if (arr.length === 1) return [arr]

  const output = []
  const partialPermutations = getPermutations(arr.slice(1))
  const first = arr[0]

  for (let i = 0, len = partialPermutations.length; i < len; i++) {
    const partial = partialPermutations[i]

    for (let j = 0, len2 = partial.length; j <= len2; j++) {
      const start = partial.slice(0, j)
      const end = partial.slice(j)
      const merged = [...start, first, ...end]

      output.push(merged)
    }
  }

  return output
}

export function getCommandIdPermutations(commandId: string): string[] {
  return getPermutations(commandId.split(':')).flatMap((c) => c.join(':'))
}

/**
 * Return an array of ids that represent all the usable combinations that a user could enter.
 *
 * For example, if the command ids are:
 * - foo:bar:baz
 * - one:two:three
 * Then the usable ids would be:
 * - foo
 * - foo:bar
 * - foo:bar:baz
 * - one
 * - one:two
 * - one:two:three
 *
 * This allows us to determine which parts of the argv array belong to the command id whenever the topicSeparator is a space.
 *
 * @param commandIds string[]
 * @returns string[]
 */
export const collectUsableIds = (commandIds: string[]): Set<string> =>
  new Set(commandIds.flatMap((id) => id.split(':').map((_, i, a) => a.slice(0, i + 1).join(':'))))
