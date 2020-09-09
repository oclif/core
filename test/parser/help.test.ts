import {expect} from 'chai'

import * as flags from '../../src/parser/flags'
import {flagUsages} from '../../src/parser/help'

describe('flagUsage', () => {
  it('shows usages', () => {
    const f = [
      flags.string({name: 'bak'}),
      flags.string({name: 'baz', description: 'baz'}),
      flags.string({name: 'bar', char: 'b', description: 'bar'}),
      flags.string({name: 'foo', char: 'f', description: 'desc'}),
      flags.string({name: 'foo', char: 'f', helpLabel: '-f'}),
      flags.boolean({char: 'g', description: 'goo'}),
    ]
    expect(flagUsages(f)).to.deep.equal([
      [' -b, --bar BAR', 'bar'],
      [' -f, --foo FOO', 'desc'],
      [' -f FOO', undefined],
      [' -g', 'goo'],
      [' --bak BAK', undefined],
      [' --baz BAZ', 'baz'],
    ])
  })
})
