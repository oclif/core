import {expect} from 'chai'

import {Config} from '../../src'
import {Options} from '../../src/interfaces'
import {THEME_KEYS, parseTheme} from '../../src/interfaces/config'

describe('theme', () => {
  describe('config', () => {
    it('should be created with enableTheme equals to false', () => {
      const config: Config = new Config({} as Options)

      expect(config.enableTheme).to.be.false
    })
  })

  describe('parsing', () => {
    it('should parse untyped theme json to theme', () => {
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
        expect(THEME_KEYS.includes(key)).to.be.true
      }
    })

    it('should parse alias', () => {
      const untypedTheme = {
        alias: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.alias?.hex()).to.equal('#FFFFFF')
    })

    it('should parse bin', () => {
      const untypedTheme = {
        bin: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.bin?.hex()).to.equal('#FFFFFF')
    })

    it('should parse command', () => {
      const untypedTheme = {
        command: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.command?.hex()).to.equal('#FFFFFF')
    })

    it('should parse commandSummary', () => {
      const untypedTheme = {
        commandSummary: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.commandSummary?.hex()).to.equal('#FFFFFF')
    })

    it('should parse dollarSign', () => {
      const untypedTheme = {
        dollarSign: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.dollarSign?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flag', () => {
      const untypedTheme = {
        flag: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flag?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flagDefaultValue', () => {
      const untypedTheme = {
        flagDefaultValue: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flagDefaultValue?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flagOptions', () => {
      const untypedTheme = {
        flagOptions: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flagOptions?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flagRequired', () => {
      const untypedTheme = {
        flagRequired: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flagRequired?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flagSeparator', () => {
      const untypedTheme = {
        flagSeparator: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flagSeparator?.hex()).to.equal('#FFFFFF')
    })

    it('should parse flagType', () => {
      const untypedTheme = {
        flagType: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.flagType?.hex()).to.equal('#FFFFFF')
    })

    it('should parse sectionDescription', () => {
      const untypedTheme = {
        sectionDescription: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.sectionDescription?.hex()).to.equal('#FFFFFF')
    })

    it('should parse sectionHeader', () => {
      const untypedTheme = {
        sectionHeader: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.sectionHeader?.hex()).to.equal('#FFFFFF')
    })

    it('should parse topic', () => {
      const untypedTheme = {
        topic: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.topic?.hex()).to.equal('#FFFFFF')
    })

    it('should parse version', () => {
      const untypedTheme = {
        version: '#FFFFFF',
      }

      const theme = parseTheme(untypedTheme)

      expect(theme.version?.hex()).to.equal('#FFFFFF')
    })

    it('should not parse color key that is not part of Theme', () => {
      const untypedTheme = {
        batman: '#000000',
      }

      const theme = parseTheme(untypedTheme)

      expect(Object.keys(theme).includes('batman')).to.be.false
    })
  })
})
