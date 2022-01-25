import {CliUx} from '../../src'
import {expect} from 'chai'

type MyColumns = Record<string, unknown>
const options: CliUx.Table.table.Options = {}
const columns: CliUx.Table.table.Columns<MyColumns> = {}
const iPromptOptions: CliUx.IPromptOptions = {}

describe('cli-ux exports', () => {
  it('should have exported members on par with old cli-ux module', () => {
    expect(options).to.be.ok
    expect(columns).to.be.ok
    expect(iPromptOptions).to.be.ok
    expect(CliUx.Table.table.Flags).to.be.ok
    expect(typeof CliUx.Table.table.flags).to.be.equal('function')
    expect(typeof CliUx.Table.table).to.be.equal('function')
    expect(CliUx.ux).to.be.ok
    expect(CliUx.config).to.be.ok
    expect(typeof CliUx.Config).to.be.equal('function')
    expect(typeof CliUx.ActionBase).to.be.equal('function')
    expect(typeof CliUx.ExitError).to.be.equal('function')
  })
})

