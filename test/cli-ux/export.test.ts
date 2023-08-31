import ux, {Table, IPromptOptions, Config, ActionBase, ExitError} from '../../src/ux'
import {expect} from 'chai'

type MyColumns = Record<string, unknown>
const options: Table.table.Options = {}
const columns: Table.table.Columns<MyColumns> = {}
const iPromptOptions: IPromptOptions = {}

describe('ux exports', () => {
  it('should have exported members on par with old cli-ux module', () => {
    expect(options).to.be.ok
    expect(columns).to.be.ok
    expect(iPromptOptions).to.be.ok
    expect(Table.table.Flags).to.be.ok
    expect(typeof Table.table.flags).to.be.equal('function')
    expect(typeof Table.table).to.be.equal('function')
    expect(ux.config).to.be.ok
    expect(typeof Config).to.be.equal('function')
    expect(typeof ActionBase).to.be.equal('function')
    expect(typeof ExitError).to.be.equal('function')
  })
})

