import {DirectedAcyclicGraph, Node, Edge, EdgeClass} from '../../src/config/graph'
import {expect} from './test'

describe('graph', () => {
  it('should construct a new graph', () => {
    const graph = new DirectedAcyclicGraph()
    expect(graph).to.be.ok
    expect(graph.edges()).to.have.lengthOf(0)
    expect(graph.nodes()).to.have.lengthOf(0)
  })
  it('should add nodes without edges', () => {
    const graph = new DirectedAcyclicGraph()
    graph.setNode('a', {id: 'a'})
    graph.setNode('b', {id: 'b'})
    expect(graph.edges()).to.have.lengthOf(0)
    expect(graph.nodes()).to.have.lengthOf(2)
  })
  it('should add nodes and edges', () => {
    const graph = new DirectedAcyclicGraph()
    graph.setEdge({id: 'a'}, {id: 'b'})
    const edges = graph.edges()
    expect(edges).to.have.lengthOf(1)
    expect(edges[0].source.id).to.be.equal('a')
    expect(edges[0].sink.id).to.be.equal('b')
    expect(graph.nodes()).to.have.lengthOf(2)
  })
  it('should filter nodes', () => {
    const graph = new DirectedAcyclicGraph()
    graph.setNode('a', {id: 'a'})
    graph.setNode('b', {id: 'b'})
    expect(graph.edges()).to.have.lengthOf(0)
    expect(graph.nodes()).to.have.lengthOf(2)
    expect(graph.nodes(node => node.id === 'a')).to.have.lengthOf(1)
  })
  it('should filter edges', () => {
    const graph = new DirectedAcyclicGraph()
    graph.setEdge({id: 'a'}, {id: 'b'})
    graph.setEdge({id: 'a'}, {id: 'c'})
    const edges = graph.edges()
    expect(edges).to.have.lengthOf(2)
    expect(graph.edges(edge => edge.sink.id === 'c')).to.have.lengthOf(1)
  })
  it('should remove nodes and edges', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    graph.setEdge({id: 'a'}, {id: 'b'})
    graph.setEdge({id: 'a'}, {id: 'c'})
    let edges = graph.edges()
    expect(edges).to.have.lengthOf(2)
    graph.removeEdges(...graph.edges(edge => edge.sink.id === 'c'))
    edges = graph.edges()
    expect(edges).to.have.lengthOf(1)
    graph.removeNode('a')
    edges = graph.edges()
    expect(edges).to.have.lengthOf(0)
  })
})

describe('lowest common ancestor', () => {
  /*
  * nodeA -> nodeB
  *       -> nodeC
   */
  it('should find a lca', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeC = {id: 'c'} as Node
    graph.setEdge(nodeA, nodeB)
    graph.setEdge(nodeA, nodeC)
    const lca = graph.lca(nodeB, nodeC)
    expect(lca).to.be.equal(nodeA)
  })
  /*
  * nodeA -> nodeB -> nodeD
  *       -> nodeC -> nodeE
   */
  it('should find a lca with different leaf nodes having more than one parent', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeC = {id: 'c'} as Node
    const nodeD = {id: 'd'} as Node
    const nodeE = {id: 'e'} as Node
    graph.setEdge(nodeA, nodeB)
    graph.setEdge(nodeA, nodeC)
    graph.setEdge(nodeB, nodeD)
    graph.setEdge(nodeC, nodeE)
    const lca = graph.lca(nodeD, nodeE)
    expect(lca).to.be.equal(nodeA)
  })
  /*
  * nodeA -> nodeB -> nodeD
  *       -> nodeC -> nodeD
   */
  it('should find a lca with different paths to same leaf node', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeC = {id: 'c'} as Node
    const nodeD = {id: 'd'} as Node
    graph.setEdge(nodeA, nodeB)
    graph.setEdge(nodeA, nodeC)
    graph.setEdge(nodeB, nodeD)
    graph.setEdge(nodeC, nodeD)
    const lca = graph.lca(nodeD)
    expect(lca).to.be.equal(nodeA)
  })
  /*
  * nodeA -> nodeNonRootLCA -> nodeB -> nodeD
  *                         -> nodeC -> nodeD
   */
  it('should find a non-root lca with different paths to same leaf node', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeNonRootLCA = {id: 'nodeNonRootLCA'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeC = {id: 'c'} as Node
    const nodeD = {id: 'd'} as Node
    graph.setEdge(nodeA, nodeNonRootLCA)
    graph.setEdge(nodeNonRootLCA, nodeB)
    graph.setEdge(nodeNonRootLCA, nodeC)
    graph.setEdge(nodeB, nodeD)
    graph.setEdge(nodeC, nodeD)
    const lca = graph.lca(nodeD)
    expect(lca).to.be.equal(nodeNonRootLCA)
  })
  /*
  * nodeA -> nodeNonRootLCA -> nodeB -> nodeD
  *                         -> nodeD
   */
  it('should find a non-root lca with different path lengths to same leaf node', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeNonRootLCA = {id: 'nodeNonRootLCA'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeD = {id: 'd'} as Node
    graph.setEdge(nodeA, nodeNonRootLCA)
    graph.setEdge(nodeNonRootLCA, nodeB)
    graph.setEdge(nodeNonRootLCA, nodeD)
    graph.setEdge(nodeB, nodeD)
    const lca = graph.lca(nodeD)
    expect(lca).to.be.equal(nodeNonRootLCA)
  })
  /*
* nodeA -> nodeB
* nodeC -> nodeD
 */
  it('should not find a non-root lca with disjoint paths', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeC = {id: 'c'} as Node
    const nodeD = {id: 'd'} as Node
    graph.setEdge(nodeA, nodeB)
    graph.setEdge(nodeC, nodeD)
    const lca = graph.lca(nodeB, nodeD)
    expect(lca).to.not.be.ok
  })
  /*
  * nodeA -> nodeNonRootLCA -> nodeB -> nodeD
  *                         -> nodeD
   */
  it('should find a non-root lca with different path lengths to same leaf node with non linear node/edge creation', () => {
    const graph = new DirectedAcyclicGraph<Node, EdgeClass<Node, Edge>>()
    const nodeA = {id: 'a'} as Node
    const nodeNonRootLCA = {id: 'nodeNonRootLCA'} as Node
    const nodeB = {id: 'b'} as Node
    const nodeD = {id: 'd'} as Node
    graph.setEdge(nodeA, nodeNonRootLCA)
    graph.setEdge(nodeB, nodeD)
    graph.setEdge(nodeNonRootLCA, nodeB)
    graph.setEdge(nodeNonRootLCA, nodeD)
    const lca = graph.lca(nodeD)
    expect(lca).to.be.equal(nodeNonRootLCA)
  })
})
