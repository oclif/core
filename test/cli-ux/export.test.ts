import {ux} from '../../src'
import {expect} from 'chai'

type MyColumns = Record<string, unknown>
const options: ux.Table.table.Options = {}
const columns: ux.Table.table.Columns<MyColumns> = {}
const iPromptOptions: ux.IPromptOptions = {}

describe('cli-ux exports', () => {
  it('should have exported members on par with old cli-ux module', () => {
    expect(options).to.be.ok
    expect(columns).to.be.ok
    expect(iPromptOptions).to.be.ok
    expect(ux.Table.table.Flags).to.be.ok
    expect(typeof ux.Table.table.flags).to.be.equal('function')
    expect(typeof ux.Table.table).to.be.equal('function')
    expect(ux.config).to.be.ok
    expect(typeof ux.Config).to.be.equal('function')
    expect(typeof ux.ActionBase).to.be.equal('function')
    expect(typeof ux.ExitError).to.be.equal('function')
  })
})

