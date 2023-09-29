import {Flag, FlagUsageOptions} from '../interfaces/parser'
import chalk from 'chalk'
import {sortBy} from '../util'

export function flagUsage(flag: Flag<any>, options: FlagUsageOptions = {}): [string, string | undefined] {
  const label = []

  if (flag.helpLabel) {
    label.push(flag.helpLabel)
  } else {
    if (flag.char) label.push(`-${flag.char}`)
    if (flag.name) label.push(` --${flag.name}`)
  }

  const usage = flag.type === 'option' ? ` ${flag.name.toUpperCase()}` : ''

  let description: string | undefined = flag.summary || flag.description || ''
  if (options.displayRequired && flag.required) description = `(required) ${description}`
  description = description ? chalk.dim(description) : undefined

  return [` ${label.join(',').trim()}${usage}`, description] as [string, string | undefined]
}

export function flagUsages(flags: Flag<any>[], options: FlagUsageOptions = {}): [string, string | undefined][] {
  if (flags.length === 0) return []
  return sortBy(flags, (f) => [f.char ? -1 : 1, f.char, f.name]).map((f) => flagUsage(f, options))
}
