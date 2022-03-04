import {expect, fancy} from 'fancy-test'

import {CliUx} from '../../../src'

describe('styled/object', () => {
  fancy
  .stdout()
  .end('shows a table', output => {
    CliUx.ux.styledHeader('A styled header')
    expect(output.stdout).to.equal('=== A styled header\n\n')
  })
})
