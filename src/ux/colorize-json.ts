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
  pretty?: boolean | undefined
  theme?: Record<string, string> | undefined
}

export function removeCycles(object: unknown) {
  // Keep track of seen objects.
  const seenObjects = new WeakMap<Record<string, unknown>, undefined>()

  const _removeCycles = (obj: unknown) => {
    // Use object prototype to get around type and null checks
    if (Object.prototype.toString.call(obj) === '[object Object]') {
      // We know it is a "Record<string, unknown>" because of the conditional
      const dictionary = obj as Record<string, unknown>

      // Seen, return undefined to remove.
      if (seenObjects.has(dictionary)) return

      seenObjects.set(dictionary, undefined)

      for (const key in dictionary) {
        // Delete the duplicate object if cycle found.
        if (_removeCycles(dictionary[key]) === undefined) {
          delete dictionary[key]
        }
      }
    } else if (Array.isArray(obj)) {
      for (const i in obj) {
        if (_removeCycles(obj[i]) === undefined) {
          // We don't want to delete the array, but we can replace the element with null.
          obj[i] = null
        }
      }
    }

    return obj
  }

  return _removeCycles(object)
}

function formatInput(json?: unknown, options?: Options) {
  return options?.pretty
    ? JSON.stringify(typeof json === 'string' ? JSON.parse(json) : json, null, 2)
    : typeof json === 'string'
      ? json
      : JSON.stringify(json)
}

export function tokenize(json?: unknown, options?: Options) {
  let input = formatInput(removeCycles(json), options)

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
  const opts = {...options, pretty: options?.pretty ?? true}
  return tokenize(json, opts).reduce((acc, token) => acc + colorize(options?.theme?.[token.type], token.value), '')
}
