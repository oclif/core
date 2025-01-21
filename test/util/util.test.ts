import {expect} from 'chai'

import {capitalize, castArray, isNotFalsy, isTruthy, last, maxBy, mergeNestedObjects, sumBy} from '../../src/util/util'

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
