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
    
    // This is just calculating the factorial (n!) of the number of elements passed in.
    const numberOfPermutations = (commandID: string): number => {
      const num = commandID.split(':').length
      let result = 1
      for (let i = 2; i <= num; i++)
        result *= i
      return result
    }

    test
    .it('returns the correct number of permutations', async () => {
      expect(getCommandIdPermutations('one').length).to.equal(numberOfPermutations('one'))
      expect(getCommandIdPermutations('one:two').length).to.equal(numberOfPermutations('one:two'))
      expect(getCommandIdPermutations('one:two:three').length).to.equal(numberOfPermutations('one:two:three'))
      expect(getCommandIdPermutations('one:two:three:four').length).to.equal(numberOfPermutations('one:two:three:four'))
      expect(getCommandIdPermutations('one:two:three:four:five').length).to.equal(numberOfPermutations('one:two:three:four:five'))
      expect(getCommandIdPermutations('one:two:three:four:five:six').length).to.equal(numberOfPermutations('one:two:three:four:five:six'))
      expect(getCommandIdPermutations('one:two:three:four:five:six:seven').length).to.equal(numberOfPermutations('one:two:three:four:five:six:seven'))
      expect(getCommandIdPermutations('one:two:three:four:five:six:seven:eight').length).to.equal(numberOfPermutations('one:two:three:four:five:six:seven:eight'))
      expect(getCommandIdPermutations('one:two:three:four:five:six:seven:eight:nine').length).to.equal(numberOfPermutations('one:two:three:four:five:six:seven:eight:nine'))
      expect(getCommandIdPermutations('one:two:three:four:five:six:seven:eight:nine:ten').length).to.equal(numberOfPermutations('one:two:three:four:five:six:seven:eight:nine:ten'))
    })
  })
})
