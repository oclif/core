import * as Color from 'color'

// chalk doesn't export a list of standard colors, so we have to supply our own
export const STANDARD_CHALK = [
  'white',
  'black',
  'blue',
  'yellow',
  'green',
  'red',
  'magenta',
  'cyan',
  'gray',
  'blackBright',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgYellow',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgWhite',
  'bgGray',
  'bgBlackBright',
  'bgRedBright',
  'bgGreenBright',
  'bgYellowBright',
  'bgBlueBright',
  'bgMagentaBright',
  'bgCyanBright',
  'bgWhiteBright',
] as const

export type StandardChalk = (typeof STANDARD_CHALK)[number]

export type Theme = Record<string, Color | StandardChalk>
