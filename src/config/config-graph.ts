import {DirectedGraph} from 'graphology'
import {Attributes} from 'graphology-types'
import {subgraph} from 'graphology-operators'
import {Config, Command, PJSON} from '../interfaces'
import * as crypto from 'crypto'

/* start of Akseli Palén code */
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

/* end of Akseli Palén code */

const genKey = (): string => crypto.randomBytes(16).toString('hex')

const legalEdges = [
  ['command', 'pluginCommand'],
  ['commandAlias', 'command'],
  ['comboCommand', 'command'],
  ['flag', 'command'],
  ['flagAlias', 'flag'],
  ['plugin', 'pluginCommand'],
]

type NodeType = 'topic' | 'command' | 'flag' | 'commandAlias' | 'flagAlias' | 'comboCommand' | 'plugin' | 'pluginCommand'

export interface NodeAttributes extends Attributes {
  nodeType: NodeType
  color: string
  label: string
  x: number
  y: number
  command?: Command.Loadable
}

export type GraphNodeAttributes = NodeAttributes;

abstract class GraphNode implements NodeAttributes {
  get command(): Command.Loadable | undefined {
    return this.#command
  }

  set command(value: Command.Loadable | undefined) {
    this.#command = value
  }

  get key(): string {
    return `${this.nodeType}|${this.#key}`
  }

  set key(value: string) {
    this.#key = value
  }

  get attributes(): GraphNodeAttributes {
    return {
      nodeType: this.nodeType,
      color: this.color,
      label: this.label,
      x: this.x,
      y: this.y,
      command: this.command,
    }
  }

  #key: string
  #command: Command.Loadable | undefined

  protected constructor(key: string, type: GraphNodeAttributes) {
    this.#key = key
    this.nodeType = type.nodeType
    this.color = type.color
    this.label = key
    this.x = type.x
    this.y = type.y
    this.#command = type.command
  }

  [name: string]: any

  public readonly nodeType: NodeType
  public color: string
  public label: string
  x: number
  y: number
}

export class PluginCommandNode extends GraphNode {
  constructor(key: string, command: Command.Loadable) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'pluginCommand', command})
  }
}

export class CommandNode extends GraphNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'command'})
  }
}

export class CommandAliasNode extends GraphNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'commandAlias'})
  }
}

export class CommandComboNode extends GraphNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'comboCommand'})
  }
}

export class FlagNode extends GraphNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'flag'})
  }
}

export class FlagAliasNode extends GraphNode {
  constructor(key: string) {
    super(key, {color: '', label: '', x: 0, y: 0, nodeType: 'flagAlias'})
  }
}
export class PluginNode extends GraphNode {
  constructor(key: string | undefined) {
    super(key ?? genKey(), {color: '', label: '', x: 0, y: 0, nodeType: 'plugin'})
  }
}

export class ConfigGraph extends DirectedGraph<GraphNodeAttributes, Attributes, Attributes> {
  public constructor(private readonly flexibleTaxonomy: boolean | undefined, private readonly pjson: PJSON.CLI) {
    super()
  }

  public static fromConfig(config: Config): ConfigGraph {
    const graph = new ConfigGraph(config.flexibleTaxonomy, config.pjson)
    for (const command of config.commands) {
      const pluginCommand = graph.addPluginCommand(command.id, command)
      graph.addPlugin(command.pluginAlias || command.pluginName, command.id)
      graph.addCommand(command.id, pluginCommand)

      if (config.flexibleTaxonomy) {
        const combos = combinations(command.id.split(':'))
        for (const combo of combos) {
          graph.addCommandCombo(combo.join(':'), command.id)
        }
      }

      for (const alias of command.aliases) {
        graph.addCommandAlias(alias, command.id)
        if (config.flexibleTaxonomy) {
          const combos = combinations(alias.split(':'))
          for (const combo of combos) {
            graph.addCommandCombo(combo.join(':'), command.id)
          }
        }
      }

      for (const [key, flag] of Object.entries(command.flags)) {
        graph.addFlag(key, command.id)
        for (const alias of flag.aliases || []) {
          graph.addFlagAlias(alias, key)
        }
      }
    }

    return graph
  }

  public addPluginCommand(key: string, command: Command.Loadable): PluginCommandNode {
    const node = new PluginCommandNode(key, command)
    this.addNode(node)
    return node
  }

  public addCommand(key: string, pluginCommand: PluginCommandNode): CommandNode {
    const node = new CommandNode(key)
    this.addNode(node)
    this.addEdge(node, pluginCommand)
    return node
  }

  public addCommandAlias(key: string, of?: string): CommandAliasNode {
    const node = new CommandAliasNode(key)
    this.addNode(node)
    this.addEdgeToOf(node, of, 'command')
    return node
  }

  public addCommandCombo(key: string, of?: string): CommandComboNode {
    const node = new CommandAliasNode(key)
    this.addNode(node)
    this.addEdgeToOf(node, of, 'command')
    return node
  }

  public addFlag(key: string, of?: string): FlagNode {
    const node = new FlagNode(key)
    this.addNode(node)
    this.addEdgeToOf(node, of, 'command')
    return node
  }

  public addFlagAlias(key: string, of?: string): FlagAliasNode {
    const node = new FlagAliasNode(key)
    this.addNode(node)
    this.addEdgeToOf(node, of, 'flag')
    return node
  }

  public addPlugin(key: string | undefined, of: string): PluginNode {
    const node = new PluginNode(key)
    this.addNode(node)
    this.addEdgeToOf(node, of, 'pluginCommand')
    return node
  }

  public addNode(node: GraphNode): string {
    if (!this.hasNode(node.key)) {
      super.addNode(node.key, node.attributes)
    }

    return node.key
  }

  public addEdge(source: GraphNode, target: GraphNode, attributes?: Attributes | undefined): string {
    if (!legalEdges.some(([sourceType, targetType]) => source.nodeType === sourceType && target.nodeType === targetType)) {
      throw new Error(`Illegal edge: ${source.key} -> ${target.key}`)
    }

    const edgeKey = this.getEdgeKey(source, target)
    if (!this.hasEdge(source.key, target.key)) {
      super.addEdgeWithKey(edgeKey, source.key, target.key, attributes)
    }

    return edgeKey
  }

  public findCommand(command: string, opts: { must: boolean }): Command.Loadable {
    // given a command id, find the command
    // a command string maybe a command id, a command alias, or a command combo

    const commandKeys = this.getCommandKeys(command)
    const pluginCommand = this.determinePriority(this.getPluginCommandKeys(commandKeys))

    if (opts.must && !pluginCommand) {
      throw new Error(`Command not found: ${command}`)
    }

    return pluginCommand
  }

  public findMatches(command: string, flags: string[]): (Command.Loadable | undefined)[] | undefined {
    const commandKeys = this.getCommandKeys(command)
    if (commandKeys.length === 0) return
    const pluginCommandKeys = this.getPluginCommandKeys(commandKeys)

    // with the flags, produce a list of flag keys
    const flagKeys = [
      // the flag itself
      flags.map(flag => this.getNodeKey(flag, 'flag')).filter(key => this.hasNode(key)),
      // the flag keys from flag aliases
      flags.map(flag =>
        this.outboundNeighbors(this.getNodeKey(flag, 'flagAlias')).filter(node => this.getNodeAttribute(node, 'nodeType') === 'flag')),
    ].flat(2)

    const commandsWithFlags = subgraph(this, [...pluginCommandKeys, ...flagKeys])

    const commandsWithAllFlags = subgraph(this, commandsWithFlags.filterNodes(node => {
      const inboundNeighbors = this.inboundNeighbors(node)
      const flagNodes = new Set(inboundNeighbors
      .filter(n => this.getNodeAttributes(n).type === 'flag'))
      return flagKeys.every(flag => flagNodes.has(flag))
    }))
    return commandsWithAllFlags.nodes().map(node => this.getNodeAttribute(node, 'command'))
  }

  private getNodeKey(id: string, type: NodeType): string {
    return `${type}|${id}`
  }

  private getEdgeKey(source: GraphNode, target: GraphNode): string {
    return `${source.key}->${target.key}`
  }

  private addEdgeToOf(node: GraphNode, of: string | undefined, type: NodeType) {
    if (of) {
      const ofKey = this.getNodeKey(of, type)
      if (this.hasNode(ofKey)) {
        switch (type) {
        case 'pluginCommand':
          this.addEdge(node, new PluginCommandNode(of, this.getNodeAttribute(ofKey, 'command') as Command.Loadable))
          break
        case 'flag':
          this.addEdge(node, new FlagNode(of))
          break
        case 'command':
          this.addEdge(node, new CommandNode(of))
          break
        default:
          break
        }
      }
    }
  }

  private getPluginCommandKeys(commandKeys: string | string[]): string[] {
    const keys = Array.isArray(commandKeys) ? commandKeys : [commandKeys]
    return keys.flatMap(key => this.outboundNeighbors(key).filter(node => this.getNodeAttribute(node, 'nodeType') === 'pluginCommand'))
  }

  private getCommandKeys(command: string): string[] {
    return ([this.getNodeKey(command, 'command'),
      this.getNodeKey(command, 'commandAlias'),
      this.flexibleTaxonomy ? this.getNodeKey(command, 'comboCommand') : undefined].filter(key => key) as string[])
    .map(key => {
      if (this.hasNode(key)) {
        const node = this.getNodeAttributes(key)
        if (node.nodeType === 'command') {
          return key
        }

        return this.outboundNeighbors(key).filter(n => n.startsWith('command:'))
      }

      return []
    }).flat(2).filter(n => n)
  }

  /**
   * This method is responsible for locating the correct plugin to use for a named command id
   * It searches the {Config} registered commands to match either the raw command id or the command alias
   * It is possible that more than one command will be found. This is due the ability of two distinct plugins to
   * create the same command or command alias.
   *
   * In the case of more than one found command, the function will select the command based on the order in which
   * the plugin is included in the package.json `oclif.plugins` list. The command that occurs first in the list
   * is selected as the command to run.
   *
   * Commands can also be present from either an install or a link. When a command is one of these and a core plugin
   * is present, this function defers to the core plugin.
   *
   * If there is not a core plugin command present, this function will return the first
   * plugin as discovered (will not change the order)
   *
   * @param commands commands to determine the priority of
   * @returns command instance {Command.Loadable} or undefined
   */
  private determinePriority(commandKeys: string[]): Command.Loadable {
    const oclifPlugins = this.pjson.oclif?.plugins ?? []
    if (commandKeys.length === 1) {
      return this.getNodeAttribute(commandKeys[0], 'command') as Command.Loadable
    }

    const commandPlugins = commandKeys.map(key => this.getNodeAttributes(key).command!)
    .sort((a, b) => {
      const pluginAliasA = a.pluginAlias ?? 'A-Cannot-Find-This'
      const pluginAliasB = b.pluginAlias ?? 'B-Cannot-Find-This'
      const aIndex = oclifPlugins.indexOf(pluginAliasA)
      const bIndex = oclifPlugins.indexOf(pluginAliasB)
      // When both plugin types are 'core' plugins sort based on index
      if (a.pluginType === 'core' && b.pluginType === 'core') {
        // If b appears first in the pjson.plugins sort it first
        return aIndex - bIndex
      }

      // if b is a core plugin and a is not sort b first
      if (b.pluginType === 'core' && a.pluginType !== 'core') {
        return 1
      }

      // if a is a core plugin and b is not sort a first
      if (a.pluginType === 'core' && b.pluginType !== 'core') {
        return -1
      }

      // neither plugin is core, so do not change the order
      return 0
    })
    return commandPlugins[0]
  }
}
