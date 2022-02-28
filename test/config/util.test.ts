import {expect, test} from '@oclif/test'
import {collectUsableIds, getCommandIdPermutations} from '../../src/config/util'

describe('util', () => {
  describe('collectUsableIds', () => {
    test
    .it('returns all usable command ids', async () => {
      const ids = collectUsableIds(['foo:bar:baz', 'one:two:three'])
      expect(ids).to.deep.equal([
        'foo',
        'foo:bar',
        'foo:bar:baz',
        'one',
        'one:two',
        'one:two:three',
      ])
    })
  })

  describe('getCommandIdPermutations', () => {
    test
    .it('returns all usable command ids', async () => {
      const permutations = getCommandIdPermutations('foo:bar:baz')
      expect(permutations).to.deep.equal([
        'foo:bar:baz',
        'bar:foo:baz',
        'bar:baz:foo',
        'foo:baz:bar',
        'baz:foo:bar',
        'baz:bar:foo',
      ])
    })
  })
})
