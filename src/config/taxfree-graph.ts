import {DirectedGraph} from 'graphology'
import {Attributes} from 'graphology-types'

/**
 * Copyright 2012 Akseli Palén.
 * Created 2012-07-15.
 * Licensed under the MIT license.
 *
 * <license>
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * </lisence>
 *
 * Implements functions to calculate combinations of elements in JS Arrays.
 *
 * Functions:
 *   k_combinations(set, k) -- Return all k-sized combinations in a set
 *   combinations(set) -- Return all combinations of the set
 */

// the following two functions are derivative works from gist https://gist.github.com/axelpale/3118596
// including the license above
const kCombinations = (set: string[], k: number): string[][] => {
  if (k > set.length || k <= 0) {
    return []
  }

  if (k === set.length) {
    return [set]
  }

  if (k === 1) {
    return set.reduce((acc, cur) => [...acc, [cur]], [] as string[][])
  }

  const combs: string[][] = []
  let tailCombs = []

  for (let i = 0; i <= set.length - k + 1; i++) {
    tailCombs = kCombinations(set.slice(i + 1), k - 1)
    for (const tailComb of tailCombs) {
      combs.push([set[i], ...tailComb])
    }
  }

  return combs
}

export const combinations = (set: string[]): string[][] => {
  return set.reduce((acc, cur, idx) => [...acc, ...kCombinations(set, idx + 1)], [] as string[][])
}

type NodeType = 'topic' | 'command' | 'flag' | 'commandAlias' | 'flagAlias'

export interface NodeAttributes extends Attributes {
  nodeType: NodeType
  color: string
  label: string
  x: number
  y: number
}

export type TaxFreeNodeAttributes = NodeAttributes;

abstract class TaxFreeNode implements NodeAttributes {
  get key(): string {
    return `${this.nodeType}|${this.#key}`
  }

  set key(value: string) {
    this.#key = value
  }

  get attributes(): TaxFreeNodeAttributes {
    return {
      nodeType: this.nodeType,
      color: this.color,
      label: this.label,
      x: this.x,
      y: this.y,
    }
  }

  #key: string

  protected constructor(key: string, type: TaxFreeNodeAttributes) {
    this.#key = key
    this.nodeType = type.nodeType
    this.color = type.color
    this.label = key
    this.x = type.x
    this.y = type.y
  }

  public nodeType: NodeType
  public color: string
  public label: string
  x: number
  y: number
}

export class CommandNode extends TaxFreeNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'command'})
  }
}

export class CommandAliasNode extends TaxFreeNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'commandAlias'})
  }
}

export class FlagNode extends TaxFreeNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'flag'})
  }
}

export class FlagAliasNode extends TaxFreeNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'flagAlias'})
  }
}

export class TaxFreeGraph extends DirectedGraph<TaxFreeNodeAttributes, Attributes, Attributes> {
  public addCommand(key: string): CommandNode {
    const node = new CommandNode(key)
    this.addNode(node)
    return node
  }

  public addCommandAlias(key: string): CommandAliasNode {
    const node = new CommandAliasNode(key)
    this.addNode(node)
    return node
  }

  public addFlag(key: string): FlagNode {
    const node = new FlagNode(key)
    this.addNode(node)
    return node
  }

  public addFlagAlias(key: string): FlagAliasNode {
    const node = new FlagAliasNode(key)
    this.addNode(node)
    return node
  }

  public addNode(node: TaxFreeNode): string {
    if (!this.hasNode(node.key)) {
      super.addNode(node.key, node.attributes)
    }

    return node.key
  }

  public addEdge(source: TaxFreeNode, target: TaxFreeNode, attributes?: Attributes | undefined): string {
    if (source.nodeType === 'command' && target.nodeType === 'command') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'flag' && target.nodeType === 'flag') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'commandAlias' && target.nodeType === 'commandAlias') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'flagAlias' && target.nodeType === 'flagAlias') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'command' && target.nodeType === 'flag') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'command' && target.nodeType === 'commandAlias') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'command' && target.nodeType === 'flagAlias') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    if (source.nodeType === 'flag' && target.nodeType === 'commandAlias') {
      throw new Error(`Cannot add edge from ${source} to ${target}`)
    }

    const edgeKey = this.getEdgeKey(source, target)
    if (!this.hasEdge(source.key, target.key)) {
      super.addEdgeWithKey(edgeKey, source.key, target.key, attributes)
    }

    return edgeKey
  }

  private getEdgeKey(source: TaxFreeNode, target: TaxFreeNode): string {
    return `${source.key}->${target.key}`
  }
}
