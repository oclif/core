import {stdtermwidth} from '../screen'
import {maxBy} from './util'
import {List} from '../interfaces'

function linewrap(length: number, s: string): string {
  const lw = require('@oclif/linewrap')
  return lw(length, stdtermwidth, {
    skipScheme: 'ansi-color',
  })(s).trim()
}

export function renderList(items: List): string {
  if (items.length === 0) {
    return ''
  }

  const maxLength = maxBy(items, i => i[0].length)![0].length
  const lines = items.map(i => {
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
