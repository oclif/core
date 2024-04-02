import {colorize} from './theme'
const tokenTypes = [
  {regex: /^\s+/, tokenType: 'whitespace'},
  {regex: /^[{}]/, tokenType: 'brace'},
  {regex: /^[[\]]/, tokenType: 'bracket'},
  {regex: /^:/, tokenType: 'colon'},
  {regex: /^,/, tokenType: 'comma'},
  {regex: /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i, tokenType: 'number'},
  {regex: /^"(?:\\.|[^"\\])*"(?=\s*:)/, tokenType: 'key'},
  {regex: /^"(?:\\.|[^"\\])*"/, tokenType: 'string'},
  {regex: /^true|^false/, tokenType: 'boolean'},
  {regex: /^null/, tokenType: 'null'},
]

type Options = {
  pretty?: boolean
  theme?: Record<string, string>
}

function formatInput(json?: unknown, options?: Options) {
  return options?.pretty
    ? JSON.stringify(typeof json === 'string' ? JSON.parse(json) : json, null, 2)
    : typeof json === 'string'
      ? json
      : JSON.stringify(json)
}

export function tokenize(json?: unknown, options?: Options) {
  let input = formatInput(json, options)

  const tokens = []
  let foundToken = false

  do {
    for (const tokenType of tokenTypes) {
      const match = tokenType.regex.exec(input)
      if (match) {
        tokens.push({type: tokenType.tokenType, value: match[0]})
        input = input.slice(match[0].length)
        foundToken = true
        break
      }
    }
  } while (hasRemainingTokens(input, foundToken))

  return tokens
}

function hasRemainingTokens(input: string | undefined, foundToken: boolean) {
  return (input?.length ?? 0) > 0 && foundToken
}

/**
 * Add color to JSON.
 *
 * options
 *  pretty: set to true to pretty print the JSON (defaults to true)
 *  theme: theme to use for colorizing. See keys below for available options. All keys are optional and must be valid colors (e.g. hex code, rgb, or standard ansi color).
 *
 * Available theme keys:
 * - brace
 * - bracket
 * - colon
 * - comma
 * - key
 * - string
 * - number
 * - boolean
 * - null
 */
export default function colorizeJson(json: unknown, options?: Options) {
  return tokenize(json, options).reduce((acc, token) => acc + colorize(options?.theme?.[token.type], token.value), '')
}
