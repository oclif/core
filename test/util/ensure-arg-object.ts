import {expect} from 'chai'

import {ensureArgObject} from '../../src/util/ensure-arg-object'
describe('ensureArgObject', () => {
  it('should convert array of arguments to an object', () => {
    const args = [
      {name: 'foo', description: 'foo desc', required: true},
      {name: 'bar', description: 'bar desc'},
    ]
    const expected = {foo: args[0], bar: args[1]}
    expect(ensureArgObject(args)).to.deep.equal(expected)
  })

  it('should do nothing to an arguments object', () => {
    const args = {
      foo: {name: 'foo', description: 'foo desc', required: true},
      bar: {name: 'bar', description: 'bar desc'},
    }
    expect(ensureArgObject(args)).to.deep.equal(args)
  })
})
