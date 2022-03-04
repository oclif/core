import {expect, fancy} from 'fancy-test'

import {CliUx} from '../../../src'

describe('styled/header', () => {
  fancy
  .stdout()
  .end('shows a styled header', output => {
    CliUx.ux.styledHeader('A styled header')
    expect(output.stdout).to.equal('=== A styled header\n\n')
  })
})
