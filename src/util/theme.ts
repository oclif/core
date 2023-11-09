import chalk from 'chalk'
import * as Color from 'color'

import {STANDARD_CHALK, StandardChalk, Theme} from '../interfaces/theme'

// eslint-disable-next-line complexity
function standardChalk(color: StandardChalk, text: string): string {
  switch (color) {
    case 'red': {
      return chalk.red(text)
    }

    case 'blue': {
      return chalk.blue(text)
    }

    case 'yellow': {
      return chalk.yellow(text)
    }

    case 'green': {
      return chalk.green(text)
    }

    case 'cyan': {
      return chalk.cyan(text)
    }

    case 'magenta': {
      return chalk.magenta(text)
    }

    case 'white': {
      return chalk.white(text)
    }

    case 'black': {
      return chalk.black(text)
    }

    case 'gray': {
      return chalk.gray(text)
    }

    case 'blackBright': {
      return chalk.blackBright(text)
    }

    case 'redBright': {
      return chalk.redBright(text)
    }

    case 'greenBright': {
      return chalk.greenBright(text)
    }

    case 'yellowBright': {
      return chalk.yellowBright(text)
    }

    case 'blueBright': {
      return chalk.blueBright(text)
    }

    case 'magentaBright': {
      return chalk.magentaBright(text)
    }

    case 'cyanBright': {
      return chalk.cyanBright(text)
    }

    case 'whiteBright': {
      return chalk.whiteBright(text)
    }

    case 'bgBlack': {
      return chalk.bgBlack(text)
    }

    case 'bgRed': {
      return chalk.bgRed(text)
    }

    case 'bgGreen': {
      return chalk.bgGreen(text)
    }

    case 'bgYellow': {
      return chalk.bgYellow(text)
    }

    case 'bgBlue': {
      return chalk.bgBlue(text)
    }

    case 'bgMagenta': {
      return chalk.bgMagenta(text)
    }

    case 'bgCyan': {
      return chalk.bgCyan(text)
    }

    case 'bgWhite': {
      return chalk.bgWhite(text)
    }

    case 'bgGray': {
      return chalk.bgGray(text)
    }

    case 'bgBlackBright': {
      return chalk.bgBlackBright(text)
    }

    case 'bgRedBright': {
      return chalk.bgRedBright(text)
    }

    case 'bgGreenBright': {
      return chalk.bgGreenBright(text)
    }

    case 'bgYellowBright': {
      return chalk.bgYellowBright(text)
    }

    case 'bgBlueBright': {
      return chalk.bgBlueBright(text)
    }

    case 'bgMagentaBright': {
      return chalk.bgMagentaBright(text)
    }

    case 'bgCyanBright': {
      return chalk.bgCyanBright(text)
    }

    case 'bgWhiteBright': {
      return chalk.bgWhiteBright(text)
    }

    default: {
      return chalk.gray(text)
    }
  }
}

function isStandardChalk(color: any): color is StandardChalk {
  return STANDARD_CHALK.includes(color)
}

export function colorize(color: Color | StandardChalk | undefined, text: string): string {
  if (isStandardChalk(color)) return standardChalk(color, text)

  return color ? chalk.hex(color.hex())(text) : text
}

export function parseTheme(untypedTheme: Record<string, string>): Theme {
  return Object.fromEntries(Object.entries(untypedTheme).map(([key, value]) => [key, getColor(value)]))
}

export function getColor(color: string): Color
export function getColor(color: StandardChalk): StandardChalk
export function getColor(color: string | StandardChalk): Color | StandardChalk {
  // eslint-disable-next-line new-cap
  return isStandardChalk(color) ? color : new Color.default(color)
}
