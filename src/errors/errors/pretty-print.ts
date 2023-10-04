import indent from 'indent-string'
import wrap from 'wrap-ansi'

import {PrettyPrintableError} from '../../interfaces/errors'
import {errtermwidth} from '../../screen'
import {config} from '../config'

// These exist for backwards compatibility with CLIError
type CLIErrorDisplayOptions = {bang?: string; name?: string}

export function applyPrettyPrintOptions(error: Error, options: PrettyPrintableError): PrettyPrintableError {
  const prettyErrorKeys: (keyof PrettyPrintableError)[] = ['message', 'code', 'ref', 'suggestions']

  for (const key of prettyErrorKeys) {
    const applyOptionsKey = !(key in error) && options[key]
    if (applyOptionsKey) {
      ;(error as any)[key] = options[key]
    }
  }

  return error
}

const formatSuggestions = (suggestions?: string[]): string | undefined => {
  const label = 'Try this:'
  if (!suggestions || suggestions.length === 0) return undefined
  if (suggestions.length === 1) return `${label} ${suggestions[0]}`

  const multiple = suggestions.map((suggestion) => `* ${suggestion}`).join('\n')
  return `${label}\n${indent(multiple, 2)}`
}

export default function prettyPrint(error: Error & PrettyPrintableError & CLIErrorDisplayOptions): string | undefined {
  if (config.debug) {
    return error.stack
  }

  const {bang, code, message, name: errorSuffix, ref, suggestions} = error

  // errorSuffix is pulled from the 'name' property on CLIError
  // and is like either Error or Warning
  const formattedHeader = message ? `${errorSuffix || 'Error'}: ${message}` : undefined
  const formattedCode = code ? `Code: ${code}` : undefined
  const formattedSuggestions = formatSuggestions(suggestions)
  const formattedReference = ref ? `Reference: ${ref}` : undefined

  const formatted = [formattedHeader, formattedCode, formattedSuggestions, formattedReference]
    .filter(Boolean)
    .join('\n')

  let output = wrap(formatted, errtermwidth - 6, {hard: true, trim: false} as any)
  output = indent(output, 3)
  output = indent(output, 1, {includeEmptyLines: true, indent: bang || ''} as any)
  output = indent(output, 1)

  return output
}
