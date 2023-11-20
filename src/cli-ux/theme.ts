import chalk from 'chalk'
import * as Color from 'color'

import {STANDARD_CHALK, StandardChalk, Theme} from '../interfaces/theme'

function isStandardChalk(color: any): color is StandardChalk {
  return STANDARD_CHALK.includes(color)
}

/**
 * Add color to text.
 * @param color color to use. Can be hex code (e.g. `#ff0000`), rgb (e.g. `rgb(255, 255, 255)`) or a chalk color (e.g. `red`)
 * @param text string to colorize
 * @returns colorized string
 */
export function colorize(color: string | StandardChalk | undefined, text: string): string {
  if (isStandardChalk(color)) return chalk[color](text)

  return color ? chalk.hex(color)(text) : text
}

export function parseTheme(theme: Record<string, string>): Theme {
  return Object.fromEntries(
    Object.entries(theme)
      .map(([key, value]) => [key, getColor(value)])
      .filter(([_, value]) => value),
  )
}

export function getColor(color: string): string
export function getColor(color: StandardChalk): StandardChalk
export function getColor(color: string | StandardChalk): string | StandardChalk | undefined {
  try {
    // eslint-disable-next-line new-cap
    return isStandardChalk(color) ? color : new Color.default(color).hex()
  } catch {}
}
