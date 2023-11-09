import {expect} from 'chai'

import {THEME_KEYS} from '../../src/interfaces/config'
import {
  capitalize,
  castArray,
  isNotFalsy,
  isTruthy,
  last,
  maxBy,
  mergeNestedObjects,
  parseTheme,
  sumBy,
} from '../../src/util/util'

describe('capitalize', () => {
  it('capitalizes the string', () => {
    expect(capitalize('dominik')).to.equal('Dominik')
  })
  it('works with an empty string', () => {
    expect(capitalize('')).to.equal('')
  })
})

type Item = {x: number}

describe('sumBy', () => {
  it('returns zero for empty array', () => {
    const arr: Item[] = []
    expect(sumBy(arr, (i) => i.x)).to.equal(0)
  })
  it('returns sum for non-empty array', () => {
    const arr: Item[] = [{x: 1}, {x: 2}, {x: 3}]
    expect(sumBy(arr, (i) => i.x)).to.equal(6)
  })
})

describe('maxBy', () => {
  it('returns undefined for empty array', () => {
    const arr: Item[] = []
    expect(maxBy(arr, (i) => i.x)).to.be.undefined
  })
  it('returns max value in the array', () => {
    const arr: Item[] = [{x: 1}, {x: 3}, {x: 2}]
    expect(maxBy(arr, (i) => i.x)).to.equal(arr[1])
  })
})

describe('last', () => {
  it('returns undefined for empty array', () => {
    expect(last([])).to.be.undefined
  })
  it('returns undefined for undefined', () => {
    expect(last()).to.be.undefined
  })
  it('returns last value in the array', () => {
    const arr: Item[] = [{x: 1}, {x: 3}, {x: 2}]
    expect(last(arr)).to.equal(arr[2])
  })
  it('returns only item in array', () => {
    expect(last([6])).to.equal(6)
  })
})

describe('isNotFalsy', () => {
  it('should return true for truthy values', () => {
    expect(isNotFalsy('true')).to.be.true
    expect(isNotFalsy('1')).to.be.true
    expect(isNotFalsy('yes')).to.be.true
    expect(isNotFalsy('y')).to.be.true
  })

  it('should return false for falsy values', () => {
    expect(isNotFalsy('false')).to.be.false
    expect(isNotFalsy('0')).to.be.false
    expect(isNotFalsy('no')).to.be.false
    expect(isNotFalsy('n')).to.be.false
  })
})

describe('isTruthy', () => {
  it('should return true for truthy values', () => {
    expect(isTruthy('true')).to.be.true
    expect(isTruthy('1')).to.be.true
    expect(isTruthy('yes')).to.be.true
    expect(isTruthy('y')).to.be.true
  })

  it('should return false for falsy values', () => {
    expect(isTruthy('false')).to.be.false
    expect(isTruthy('0')).to.be.false
    expect(isTruthy('no')).to.be.false
    expect(isTruthy('n')).to.be.false
  })
})

describe('castArray', () => {
  it('should cast a value to an array', () => {
    expect(castArray('foo')).to.deep.equal(['foo'])
  })

  it('should return an array if the value is an array', () => {
    expect(castArray(['foo'])).to.deep.equal(['foo'])
  })

  it('should return an empty array if the value is undefined', () => {
    expect(castArray()).to.deep.equal([])
  })
})

describe('mergeNestedObjects', () => {
  it('should merge nested objects', () => {
    const a = {
      tsconfig: {
        compilerOptions: {
          outDir: 'dist',
          rootDir: 'src',
        },
        'ts-node': {
          transpileOnly: true,
        },
      },
    }

    const b = {
      tsconfig: {
        compilerOptions: {
          outDir: 'dist',
          rootDir: 'src',
        },
        'ts-node': {
          transpileOnly: false,
        },
      },
    }

    expect(mergeNestedObjects([a, b], 'tsconfig.ts-node')).to.deep.equal({
      transpileOnly: true,
    })
  })
})

describe('theme parsing', () => {
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
