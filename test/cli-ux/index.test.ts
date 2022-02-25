import {CliUx} from '../../src'

import {expect, fancy} from './fancy'
const hyperlinker = require('hyperlinker')

describe('url', () => {
  fancy
  .env({FORCE_HYPERLINK: '1'}, {clear: true})
  .stdout()
  .do(() => CliUx.ux.url('sometext', 'https://google.com'))
  .it('renders hyperlink', async ({stdout}) => {
    expect(stdout).to.equal('sometext\n')
  })
})

describe('hyperlinker', () => {
  fancy
  .it('renders hyperlink', async () => {
    const link = hyperlinker('sometext', 'https://google.com', {})
    // eslint-disable-next-line unicorn/escape-case
    const expected = '\u001b]8;;https://google.com\u0007sometext\u001b]8;;\u0007'
    expect(link).to.equal(expected)
  })
})
