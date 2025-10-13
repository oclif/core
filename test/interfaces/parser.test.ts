import {expect} from 'chai'

import * as Interfaces from '../../src/interfaces'

describe('Completion types', () => {
  it('allows completion property on OptionFlag', () => {
    const completion: Interfaces.Completion = {
      async options(ctx) {
        expect(ctx.config).to.exist
        return ['option1', 'option2']
      },
    }

    expect(completion).to.exist
    expect(completion.options).to.be.a('function')
  })

  it('completion context has expected properties', () => {
    const ctx: Interfaces.CompletionContext = {
      args: {myarg: 'value'},
      argv: ['cmd', 'arg'],
      config: {} as any, // Mock config
      flags: {myflag: 'value'},
    }

    expect(ctx.args).to.deep.equal({myarg: 'value'})
    expect(ctx.flags).to.deep.equal({myflag: 'value'})
    expect(ctx.argv).to.deep.equal(['cmd', 'arg'])
    expect(ctx.config).to.exist
  })

  it('completion function returns promise of strings', async () => {
    const completion: Interfaces.Completion = {
      async options(_ctx) {
        return ['a', 'b', 'c']
      },
    }

    const result = await completion.options({
      config: {} as any,
    })

    expect(result).to.be.an('array')
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })
})
