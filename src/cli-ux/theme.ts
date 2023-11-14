import chalk from 'chalk'
import * as Color from 'color'

import {STANDARD_CHALK, StandardChalk, Theme} from '../interfaces/theme'

function isStandardChalk(color: any): color is StandardChalk {
  return STANDARD_CHALK.includes(color)
}

export function colorize(color: Color | StandardChalk | undefined, text: string): string {
  if (isStandardChalk(color)) return chalk[color](text)

  return color ? chalk.hex(color.hex())(text) : text
}

export function parseTheme(untypedTheme: Record<string, string>): Theme {
  return Object.fromEntries(
    Object.entries(untypedTheme)
      .map(([key, value]) => [key, getColor(value)])
      .filter(([_, value]) => value),
  )
}

export function getColor(color: string): Color
export function getColor(color: StandardChalk): StandardChalk
export function getColor(color: string | StandardChalk): Color | StandardChalk | undefined {
  try {
    // eslint-disable-next-line new-cap
    return isStandardChalk(color) ? color : new Color.default(color)
  } catch {}
}
