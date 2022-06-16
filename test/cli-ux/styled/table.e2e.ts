import {expect, fancy} from 'fancy-test'
import {CliUx} from '../../../src'

describe('styled/table', () => {
  describe('scale tests', () => {
    const bigRows = 150_000
    fancy
    .stdout()
    .end('very tall tables don\'t exceed stack depth', output => {
      const data = Array.from({length: bigRows}).fill({id: '123', name: 'foo', value: 'bar'}) as Record<string, unknown>[]
      const tallColumns = {
        id: {header: 'ID'},
        name: {},
        value: {header: 'TEST'},
      }

      CliUx.ux.table(data, tallColumns)
      expect(output.stdout).to.include('ID')
    })

    fancy
    .stdout()
    .end('very tall, wide tables don\'t exceed stack depth', output => {
      const columns = 100
      const row = Object.fromEntries(Array.from({length: columns}).map((_, i) => [`col${i}`, 'foo']))
      const data = Array.from({length: bigRows}).fill(row) as Record<string, unknown>[]
      const bigColumns = Object.fromEntries(Array.from({length: columns}).map((_, i) => [`col${i}`, {header: `col${i}`.toUpperCase()}]))

      CliUx.ux.table(data, bigColumns)
      expect(output.stdout).to.include('COL1')
    })
  })
})

