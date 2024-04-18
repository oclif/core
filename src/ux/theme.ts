import ansis from 'ansis'

import {STANDARD_ANSI, StandardAnsi, Theme} from '../interfaces/theme'

function isStandardChalk(color: any): color is StandardAnsi {
  return STANDARD_ANSI.includes(color)
}

/**
 * Add color to text.
 * @param color color to use. Can be hex code (e.g. `#ff0000`), rgb (e.g. `rgb(255, 255, 255)`) or a standard ansi color (e.g. `red`)
 * @param text string to colorize
 * @returns colorized string
 */
export function colorize(color: string | StandardAnsi | undefined, text: string): string {
  if (!color) return text
  if (isStandardChalk(color)) return ansis[color](text)
  if (color.startsWith('#')) return ansis.hex(color)(text)
  if (color.startsWith('rgb')) {
    const [red, green, blue] = color
      .slice(4, -1)
      .split(',')
      .map((c) => Number.parseInt(c.trim(), 10))
    return ansis.rgb(red, green, blue)(text)
  }

  return text
}

export function parseTheme(theme: Record<string, string>): Theme {
  return Object.fromEntries(
    Object.entries(theme)
      .map(([key, value]) => [key, typeof value === 'string' ? isValid(value) : parseTheme(value)])
      .filter(([_, value]) => value),
  )
}

function isValid(color: string): string | undefined {
  return color.startsWith('#') || color.startsWith('rgb') || isStandardChalk(color) ? color : undefined
}
