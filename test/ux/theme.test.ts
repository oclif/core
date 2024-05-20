import ansis from 'ansis'
import {config, expect} from 'chai'

config.truncateThreshold = 0

import {colorize, parseTheme} from '../../src/ux/theme'

describe('colorize', () => {
  it('should return text with ansi characters when given hex code', () => {
    const color = '#FF0000'
    const text = colorize(color, 'brazil')
    expect(text).to.equal(ansis.hex(color)('brazil'))
  })

  it('should return text with ansi characters when standard ansis color', () => {
    const text = colorize('red', 'brazil')
    expect(text).to.equal(ansis.red('brazil'))
  })

  it('should return text without ansi characters when given undefined', () => {
    const text = colorize(undefined, 'brazil')
    expect(text).to.equal('brazil')
  })

  it('should return empty text without ansi characters when given color', () => {
    const color = '#FF0000'
    const text = colorize(color, '')
    expect(text).to.equal('')
  })

  it('should return empty text without ansi characters when given undefined', () => {
    const text = colorize(undefined, '')
    expect(text).to.equal('')
  })

  it('should return text with ansi characters when given rgb color', () => {
    const color = 'rgb(255, 0, 0)'
    const text = colorize(color, 'brazil')
    expect(text).to.equal(ansis.rgb(255, 0, 0)('brazil'))
  })

  it('should do nothing if color is not a valid color', () => {
    const text = colorize('INVALID_COLOR', 'brazil')
    expect(text).to.equal('brazil')
  })
})

describe('theme parsing', () => {
  it('should parse untyped theme json to theme using hex codes', () => {
    const untypedTheme = {
      alias: '#FFFFFF',
      bin: '#FFFFFF',
      command: '#FFFFFF',
      commandSummary: '#FFFFFF',
      dollarSign: '#FFFFFF',
      flag: '#FFFFFF',
      flagDefaultValue: '#FFFFFF',
      flagOptions: '#FFFFFF',
      flagRequired: '#FFFFFF',
      flagSeparator: '#FFFFFF',
      sectionDescription: '#FFFFFF',
      sectionHeader: '#FFFFFF',
      topic: '#FFFFFF',
      version: '#FFFFFF',
    }

    const theme = parseTheme(untypedTheme)

    expect(theme).to.deep.equal(untypedTheme)
  })

  it('should parse untyped theme json to theme using rgb', () => {
    const untypedTheme = {
      alias: 'rgb(255, 255, 255)',
    }

    const theme = parseTheme(untypedTheme)

    expect(theme).to.deep.equal({alias: 'rgb(255, 255, 255)'})
  })

  it('should parse untyped theme json to theme using ansis standard colors', () => {
    const untypedTheme = {
      alias: 'cyan',
      bin: 'cyan',
      command: 'cyan',
      commandSummary: 'cyan',
      dollarSign: 'cyan',
      flag: 'cyan',
      flagDefaultValue: 'cyan',
      flagOptions: 'cyan',
      flagRequired: 'cyan',
      flagSeparator: 'cyan',
      sectionDescription: 'cyan',
      sectionHeader: 'cyan',
      topic: 'cyan',
      version: 'cyan',
    }

    const theme = parseTheme(untypedTheme)
    for (const value of Object.values(theme)) {
      expect(value).to.equal('cyan')
    }
  })

  it('should ignore unsupported values', () => {
    const untypedTheme = {
      alias: 'FOO',
    }

    const theme = parseTheme(untypedTheme)
    expect(theme).to.deep.equal({})
  })

  it('should recursively parse nested theme', () => {
    const untypedTheme = {
      alias: 'red',
      json: {
        key: 'green',
      },
    }

    const theme = parseTheme(untypedTheme)
    expect(theme).to.deep.equal({
      alias: 'red',
      json: {
        key: 'green',
      },
    })
  })
})
