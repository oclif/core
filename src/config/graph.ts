enum VisitedColor {
  NONE,
  RED,
  GREEN,
  BLACK,
  BLUE
}

export interface Node {
  id: string;
  color?: VisitedColor;
  visitCnt?: number;
}

export interface Edge {
  source: Node;
  sink: Node;
}

export class EdgeClass<N extends Node, E extends Edge> implements Edge {
  sink: N

  source: N

  constructor(source: N, sink: N) {
    this.source = source
    this.sink = sink
  }
}

/**
 * This DAG implementation is tailored for use in config.
 * It does not represent a general solution for a DAG.
 */
export class DirectedAcyclicGraph<N extends Node, E extends EdgeClass<N, E>> {
  private _nodes = new Map<string, N>();

  private _edges = new Set<EdgeClass<N, E>>();

  setNode(name: string, node: N): void {
    this._nodes.set(name, node)
  }

  setEdge(source: N, sink: N): EdgeClass<N, E> {
    this.setNode(source.id, source)
    this.setNode(sink.id, sink)

    const edge = new EdgeClass<N, E>(source, sink)
    const foundEdge = this.findEdge(e => edge.source.id === e.source.id && edge.sink.id === e.sink.id)
    if (foundEdge) {
      return foundEdge
    }
    this._edges.add(edge)
    return edge
  }

  edges(fn = (e: EdgeClass<N, E>) => Boolean(e)): EdgeClass<N, E>[] {
    return [...this._edges.values()].filter(fn)
  }

  findEdge(fn = (e: EdgeClass<N, E>) => Boolean(e)): EdgeClass<N, E> | undefined {
    return [...this._edges.values()].find(fn)
  }

  nodes(fn = (n: N) => Boolean(n)): N[] {
    return [...this._nodes.values()].filter(fn)
  }

  removeNode(id: string): void {
    this.removeEdges(...this.edges(edge => (edge.source.id === id || edge.sink.id === id)))
    this._nodes.delete(id)
  }

  removeEdges(...edges: EdgeClass<N, E>[]): void {
    edges.forEach(edge => this.removeEdge(edge))
  }

  removeEdge(edge: EdgeClass<N, E>) {
    const foundEdge = this.findEdge(e => edge.source.id === e.source.id && edge.sink.id === e.sink.id)
    if (foundEdge) {
      this._edges.delete(foundEdge)
    }
  }

  lca(...nodes: N[]): N | undefined {
    if (nodes.length === 0) {
      return undefined
    }
    // handle graph where leaf can be reached by two different paths
    // a -> b -> c
    //   -> d ->
    let sourceNodes: N[] | undefined
    if (nodes.length === 1) {
      sourceNodes = this.getSourceNodesFromEdges(nodes[0], e => e.sink.id === nodes[0].id)
      if (sourceNodes?.length < 2) {
        return undefined
      }
      return this.lca(...sourceNodes)
    }
    // lca
    // for each node do a BFS and color each node when visited
    nodes.forEach((node, visitedColor) => {
      this.backtrackSearch(node, visitedColor + 1)
    })

    const lcaNodes = this.nodes(node => node.color === nodes.length && (node.visitCnt ?? 0) >= nodes.length)
    if (lcaNodes.length === 0) {
      return undefined
    }
    return lcaNodes[lcaNodes.length - 1]
  }

  private resetVisited() {
    this._nodes.forEach(node => {
      node.color = VisitedColor.NONE
      node.visitCnt = undefined
    })
  }

  backtrackSearch(node: N, visitedColor = VisitedColor.NONE): void {
    const queue = new Array<N>(node)
    do {
      const currentNode = queue.pop()
      if (currentNode) {
        this.colorNodes([currentNode], visitedColor)
        const sourceNodes = this.getSourceNodesFromEdges(currentNode, e => e.sink.id === currentNode.id)
        queue.unshift(...sourceNodes)
      }
    } while (queue.length > 0)
  }

  private getSourceNodesFromEdges(node: N, fn = (e: EdgeClass<N, E>) => Boolean(e)): N[] {
    return this.edges(fn).map(edge => edge.source)
  }

  private colorNodes(nodes: N[], visitedColor = VisitedColor.NONE) {
    nodes.forEach(node => {
      const n = this._nodes.get(node.id)
      if (visitedColor !== VisitedColor.NONE) {
        n!.visitCnt = n!.visitCnt ? n!.visitCnt + 1 : 1
      }
      n!.color = visitedColor
      this.setNode(node.id, node)
    })
    return nodes
  }
}
