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
  'bold',
  'underline',
  'dim',
  'italic',
  'strikethrough',
] as const

export type StandardChalk = (typeof STANDARD_CHALK)[number]

export const THEME_KEYS = [
  'alias',
  'bin',
  'command',
  'commandSummary',
  'dollarSign',
  'flag',
  'flagDefaultValue',
  'flagOptions',
  'flagRequired',
  'flagSeparator',
  'flagType',
  'sectionDescription',
  'sectionHeader',
  'topic',
  'version',
] as const

export type ThemeKey = (typeof THEME_KEYS)[number]

export type Theme = {
  [key: string | ThemeKey]: Color | StandardChalk | undefined
  alias?: Color | StandardChalk
  bin?: Color | StandardChalk
  command?: Color | StandardChalk
  commandSummary?: Color | StandardChalk
  dollarSign?: Color | StandardChalk
  flag?: Color | StandardChalk
  flagDefaultValue?: Color | StandardChalk
  flagOptions?: Color | StandardChalk
  flagRequired?: Color | StandardChalk
  flagSeparator?: Color | StandardChalk
  flagType?: Color | StandardChalk
  sectionDescription?: Color | StandardChalk
  sectionHeader?: Color | StandardChalk
  topic?: Color | StandardChalk
  version?: Color | StandardChalk
}
