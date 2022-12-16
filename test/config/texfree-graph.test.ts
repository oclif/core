import {expect} from 'chai'
import {combinations, TaxFreeGraph} from '../../src/config/taxfree-graph'

describe('texfree-graph', () => {
  let taxFreeGraph: TaxFreeGraph
  beforeEach(() => {
    taxFreeGraph = new TaxFreeGraph()
  })
  it('should be an empty graph', async () => {
    expect(taxFreeGraph.nodes().length).to.be.equal(0)
    expect(taxFreeGraph.edges().length).to.be.equal(0)
  })
  it('should be a graph with two nodes and one edge', async () => {
    const commandNode = taxFreeGraph.addCommand('a:b:c')
    const commandAliasNode = taxFreeGraph.addCommandAlias('a:b:c')
    expect(commandNode.key).to.be.equal('command|a:b:c')
    expect(commandAliasNode.key).to.be.equal('commandAlias|a:b:c')
    taxFreeGraph.addEdge(commandAliasNode, commandNode)
    expect(taxFreeGraph.nodes().length).to.be.equal(2)
    expect(taxFreeGraph.edges().length).to.be.equal(1)
    expect(taxFreeGraph.edges()[0]).to.be.equal(`${commandAliasNode.key}->${commandNode.key}`)
  })
})

describe('combinations', () => {
  it('produce combinations', async () => {
    const set = ['a', 'b', 'c']
    const combs = combinations(set)
    expect(combs).to.deep.equal([
      ['a'],
      ['b'],
      ['c'],
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'c'],
      ['a', 'b', 'c'],
    ])
  })
})
