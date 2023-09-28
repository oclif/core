import {expect} from 'chai'
import {cacheDefaultValue} from '../../src/util/cache-default-value'

describe('cacheDefaultValue', () => {
  it('should do nothing if noCacheDefault is true', async () => {
    const flag = {noCacheDefault: true}
    const result = await cacheDefaultValue(flag as any, true)
    expect(result).to.be.undefined
  })

  it('should do nothing if respectNoCacheDefault is true', async () => {
    const result = await cacheDefaultValue({} as any, true)
    expect(result).to.be.undefined
  })

  it('should return the result of defaultHelp if it exists', async () => {
    const flag = {defaultHelp: async () => 'foo'}
    const result = await cacheDefaultValue(flag as any, false)
    expect(result).to.equal('foo')
  })

  it('should return undefined if defaultHelp throws', async () => {
    const flag = {async defaultHelp() {
      throw new Error('foo')
    }}
    const result = await cacheDefaultValue(flag as any, false)
    expect(result).to.be.undefined
  })

  it('should return the result of the default if it\'s a function', async () => {
    const flag = {default: async () => 'foo'}
    const result = await cacheDefaultValue(flag as any, false)
    expect(result).to.equal('foo')
  })

  it('should return the result of the default if it\'s a simple value', async () => {
    const flag = {default: 'foo'}
    const result = await cacheDefaultValue(flag as any, false)
    expect(result).to.equal('foo')
  })
})

