import {error} from '../errors/error'
import {exit} from '../errors/exit'
import {warn} from '../errors/warn'
import Simple from './action/simple'
import Spinner from './action/spinner'
import colorizeJson from './colorize-json'
import {colorize} from './theme'
import {stderr, stdout} from './write'

export {error} from '../errors/error'
export {exit} from '../errors/exit'
export {warn} from '../errors/warn'
export {default as colorizeJson} from './colorize-json'
export {colorize} from './theme'
export {stderr, stdout} from './write'

const ACTION_TYPE =
  (Boolean(process.stderr.isTTY) &&
    !process.env.CI &&
    !['dumb', 'emacs-color'].includes(process.env.TERM!) &&
    'spinner') ||
  'simple'

export const ux = {
  action: ACTION_TYPE === 'spinner' ? new Spinner() : new Simple(),
  /**
   * Add color to text.
   * @param color color to use. Can be hex code (e.g. `#ff0000`), rgb (e.g. `rgb(255, 255, 255)`) or a standard ansi color (e.g. `red`)
   * @param text string to colorize
   * @returns colorized string
   */
  colorize,
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
  colorizeJson,
  /**
   * Throw an error.
   *
   * If `exit` option is `false`, the error will be logged to stderr but not exit the process.
   * If `exit` is set to a number, the process will exit with that code.
   */
  error,
  /**
   * Exit the process with provided exit code (defaults to 0).
   */
  exit,
  /**
   * Log a formatted string to stderr.
   *
   * See node's util.format() for formatting options.
   */
  stderr,
  /**
   * Log a formatted string to stdout.
   *
   * See node's util.format() for formatting options.
   */
  stdout,
  /**
   * Prints a pretty warning message to stderr.
   */
  warn,
}
