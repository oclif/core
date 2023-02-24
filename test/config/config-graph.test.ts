import {expect} from 'chai'
import {combinations, ConfigGraph} from '../../src/config/config-graph'
import {Command} from '../../src/command'

describe('config-graph', () => {
  let configGraph: ConfigGraph
  beforeEach(() => {
    configGraph = new ConfigGraph(false, {} as any)
  })
  it('should be an empty graph', async () => {
    expect(configGraph.nodes().length).to.be.equal(0)
    expect(configGraph.edges().length).to.be.equal(0)
  })
  it('should be a graph with two nodes and one edge', async () => {
    const pluginCommandNode = configGraph.addPluginCommand('a:b:c', {
      id: 'a:b:c',
      aliases: [],
      description: '',
      hidden: false,
      args: [],
      flags: {},
    } as unknown as Command.Loadable)
    const commandNode = configGraph.addCommand('a:b:c', pluginCommandNode)
    const commandAliasNode = configGraph.addCommandAlias('c:b:a', 'a:b:c')
    expect(pluginCommandNode.key).to.be.equal('pluginCommand|a:b:c')
    expect(commandAliasNode.key).to.be.equal('commandAlias|c:b:a')
    expect(configGraph.nodes().length).to.be.equal(3)
    expect(configGraph.edges().length).to.be.equal(2)
    expect(configGraph.edges()[1]).to.be.equal(`${commandAliasNode.key}->${commandNode.key}`)
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
