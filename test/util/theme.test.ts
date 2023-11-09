import {config, expect} from 'chai'
import chalk from 'chalk'

config.truncateThreshold = 0

import {colorize, getColor, parseTheme} from '../../src/util/theme'
describe('colorize', () => {
  it('should return text with ansi characters when given hex code', () => {
    const color = getColor('#FF0000')
    const text = colorize(color, 'brazil')
    expect(text).to.equal(chalk.hex(color.hex())('brazil'))
  })

  it('should return text with ansi characters when standard chalk color', () => {
    const text = colorize('red', 'brazil')
    expect(text).to.equal(chalk.red('brazil'))
  })

  it('should return text without ansi characters when given undefined', () => {
    const text = colorize(undefined, 'brazil')
    expect(text).to.equal('brazil')
  })

  it('should return empty text without ansi characters when given color', () => {
    const color = getColor('#FF0000')
    const text = colorize(color, '')
    expect(text).to.equal('')
  })

  it('should return empty text without ansi characters when given undefined', () => {
    const text = colorize(undefined, '')
    expect(text).to.equal('')
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
      flagType: '#FFFFFF',
      sectionDescription: '#FFFFFF',
      sectionHeader: '#FFFFFF',
      topic: '#FFFFFF',
      version: '#FFFFFF',
    }

    const theme = parseTheme(untypedTheme)

    for (const key of Object.keys(theme)) {
      expect(typeof theme[key]).to.equal('object')
      expect(theme[key]).to.have.property('model')
      expect(theme[key]).to.have.property('color')
      expect(theme[key]).to.have.property('valpha')
    }
  })

  it('should parse untyped theme json to theme using chalk standard colors', () => {
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
      flagType: 'cyan',
      sectionDescription: 'cyan',
      sectionHeader: 'cyan',
      topic: 'cyan',
      version: 'cyan',
    }

    const theme = parseTheme(untypedTheme)

    for (const key of Object.keys(theme)) {
      expect(theme[key]).to.equal('cyan')
    }
  })
})
