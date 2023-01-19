import {expect} from 'chai'
import {maxBy, sumBy, capitalize, ensureArgArray} from '../src/util'

describe('capitalize', () => {
  it('capitalizes the string', () => {
    expect(capitalize('dominik')).to.equal('Dominik')
  })
  it('works with an empty string', () => {
    expect(capitalize('')).to.equal('')
  })
})

type Item = { x: number }

describe('sumBy', () => {
  it('returns zero for empty array', () => {
    const arr: Item[] = []
    expect(sumBy(arr, i => i.x)).to.equal(0)
  })
  it('returns sum for non-empty array', () => {
    const arr: Item[] = [{x: 1}, {x: 2}, {x: 3}]
    expect(sumBy(arr, i => i.x)).to.equal(6)
  })
})

describe('maxBy', () => {
  it('returns undefined for empty array', () => {
    const arr: Item[] = []
    expect(maxBy(arr, i => i.x)).to.be.undefined
  })
  it('returns max value in the array', () => {
    const arr: Item[] = [{x: 1}, {x: 3}, {x: 2}]
    expect(maxBy(arr, i => i.x)).to.equal(arr[1])
  })
})

describe('ensureArgArray', () => {
  it('should convert arg object to array', () => {
    const args = {
      foo: {name: 'foo', description: 'foo desc', required: true},
      bar: {name: 'bar', description: 'bar desc'},
    }
    const expected = [
      {name: 'foo', description: 'foo desc', required: true},
      {name: 'bar', description: 'bar desc'},
    ]

    expect(ensureArgArray(args)).to.deep.equal(expected)
  })
})
