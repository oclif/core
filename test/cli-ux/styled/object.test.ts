import {expect, fancy} from 'fancy-test'

import {CliUx} from '../../../src'

describe('styled/object', () => {
  fancy
  .stdout()
  .end('shows a table', output => {
    CliUx.ux.styledObject([
      {foo: 1, bar: 1},
      {foo: 2, bar: 2},
      {foo: 3, bar: 3},
    ])
    expect(output.stdout).to.equal(`0: foo: 1, bar: 1
1: foo: 2, bar: 2
2: foo: 3, bar: 3
`)
  })
})
