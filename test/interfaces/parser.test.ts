import {expect} from 'chai'

import * as Interfaces from '../../src/interfaces'

describe('Completion types', () => {
  it('allows completion property on OptionFlag', () => {
    const completion: Interfaces.Completion = {
      async options() {
        return ['option1', 'option2']
      },
    }

    expect(completion).to.exist
    expect(completion.options).to.be.a('function')
  })

  it('completion function returns promise of strings', async () => {
    const completion: Interfaces.Completion = {
      async options() {
        return ['a', 'b', 'c']
      },
    }

    const result = await completion.options()

    expect(result).to.be.an('array')
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })
})
