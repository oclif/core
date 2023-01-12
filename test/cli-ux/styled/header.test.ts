import {expect, fancy} from 'fancy-test'

import {ux} from '../../../src'

describe('styled/header', () => {
  fancy
  .stdout()
  .end('shows a styled header', output => {
    ux.styledHeader('A styled header')
    expect(output.stdout).to.equal('=== A styled header\n\n')
  })
})
