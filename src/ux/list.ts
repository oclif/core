const wordwrap = require('wordwrap')

import {stdtermwidth} from '../screen'
import {maxBy} from '../util/util'

function linewrap(length: number, s: string): string {
  return wordwrap(length, stdtermwidth, {
    skipScheme: 'ansi-color',
  })(s).trim()
}

export type IListItem = [string, string | undefined]
export type IList = IListItem[]
export default function renderList(items: IListItem[]): string {
  if (items.length === 0) {
    return ''
  }

  const maxLength = maxBy(items, (item) => item[0].length)?.[0].length ?? 0
  const lines = items.map((i) => {
    let left = i[0]
    let right = i[1]
    if (!right) {
      return left
    }

    left = left.padEnd(maxLength)
    right = linewrap(maxLength + 2, right)
    return `${left}  ${right}`
  })
  return lines.join('\n')
}
