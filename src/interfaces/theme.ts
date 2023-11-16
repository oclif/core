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
  'sectionDescription',
  'sectionHeader',
  'topic',
  'version',
] as const

export type ThemeKey = (typeof THEME_KEYS)[number]

export type Theme = {
  [key: string | ThemeKey]: string | StandardChalk | undefined
  alias?: string | StandardChalk
  bin?: string | StandardChalk
  command?: string | StandardChalk
  commandSummary?: string | StandardChalk
  dollarSign?: string | StandardChalk
  flag?: string | StandardChalk
  flagDefaultValue?: string | StandardChalk
  flagOptions?: string | StandardChalk
  flagRequired?: string | StandardChalk
  flagSeparator?: string | StandardChalk
  sectionDescription?: string | StandardChalk
  sectionHeader?: string | StandardChalk
  topic?: string | StandardChalk
  version?: string | StandardChalk
}

export type Themes = {
  selected?: string
  themes?: Record<string, Record<string, string>>
}
