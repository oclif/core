/* eslint-disable max-depth */
import {
  BooleanFlag,
  Flag,
  FlagInput,
  Input,
  OptionFlag,
  OutputArgs,
  OutputFlags,
  ParserOutput,
} from './interfaces/parser'
import {parse} from './parser'

// TODO:
// - Types need some love. On the client side, `default` is coming back as `any` for option flags.
//   - I wonder if I can leverage `parse` if I implement a way to run it without validation. That way I can pass all the calculated defaults to the client.
// - Client side needs to handle all the interactions described in the spec
//   - Support two-step prompts (e.g. select and then input) for exactlyOne
// - Support atLeastOne
// - Is this actually want we want for prompt mode? Would it actually support `sf interactive`?

type When = (answers: Record<string, unknown>) => Promise<boolean>

export type FlagDependency =
  | {type: 'required'}
  | {type: 'dependsOn'; flags: string[]}
  | {type: 'exactlyOne'; flags: string[]}
  | {type: 'exclusive'; flags: string[]}
  | {type: 'all' | 'some' | 'none'; flags: (string | FlagReference)[]}
  | {
      type: 'conditional'
      flag: string
      when: When
      dependencies?: string[]
    }

export type FlagReference = {
  name: string
  when: When
  dependencies?: string[]
}

export type FlagNode = {
  name: string
  definition: OptionFlag<any> | BooleanFlag<any>
  dependencies: FlagDependency[]
}

export type FlagGraph = Map<string, FlagNode>

export type FlagPromptInfo = {
  name: string
  // Flag definition contains all the metadata needed to prompt the user (default value, parse function, multiple, etc)
  definition: OptionFlag<any> | BooleanFlag<any>
}

// Helper to normalize relationships array
function getDependencies(flagDef: Flag<any>): FlagDependency[] {
  if (!flagDef) return []
  const deps: FlagDependency[] = []
  if (Array.isArray(flagDef.relationships)) deps.push(...flagDef.relationships)
  if (flagDef.required) deps.push({type: 'required'})
  if (flagDef.dependsOn)
    deps.push({
      flags: Array.isArray(flagDef.dependsOn) ? flagDef.dependsOn : [flagDef.dependsOn],
      type: 'dependsOn',
    })
  if (flagDef.exactlyOne)
    deps.push({
      flags: Array.isArray(flagDef.exactlyOne) ? flagDef.exactlyOne : [flagDef.exactlyOne],
      type: 'exactlyOne',
    })
  if (flagDef.exclusive)
    deps.push({
      flags: Array.isArray(flagDef.exclusive) ? flagDef.exclusive : [flagDef.exclusive],
      type: 'exclusive',
    })
  // 'all', 'some', 'none' handled only if present in relationships
  return deps
}

// Helper to extract dependencies from FlagReference objects in group relationships
function extractConditionalDependencies(
  flags: (string | FlagReference)[],
): {flag: string; dependencies: string[]; when: When}[] {
  const result: {flag: string; dependencies: string[]; when: When}[] = []
  for (const ref of flags) {
    if (typeof ref === 'string') continue
    if (ref && typeof ref === 'object' && ref.name) {
      result.push({
        dependencies: Array.isArray(ref.dependencies) ? ref.dependencies : [],
        flag: ref.name,
        when: ref.when,
      })
    }
  }

  return result
}

export function buildFlagDependencyGraph(flags: FlagInput): FlagGraph {
  // Main graph construction
  const graph: FlagGraph = new Map()

  // First pass: create nodes for all flags
  for (const [name, definition] of Object.entries(flags)) {
    graph.set(name, {
      definition,
      dependencies: [],
      name,
    })
  }

  // Second pass: populate dependencies, including implicit ones from group/conditional
  for (const [name, definition] of Object.entries(flags)) {
    const node = graph.get(name)!
    const deps = getDependencies(definition)

    for (const dep of deps) {
      // For group relationships ('all', 'some', 'none'), handle FlagReference dependencies
      if (dep.type === 'all' || dep.type === 'some' || dep.type === 'none') {
        node.dependencies.push(dep)

        // For each FlagReference, add relationships
        const condRefs = extractConditionalDependencies(dep.flags)
        for (const cref of condRefs) {
          // Add dependsOn to the referenced flag node for its dependencies
          if (cref.dependencies && cref.dependencies.length > 0) {
            const targetNode = graph.get(cref.flag)
            if (targetNode) {
              targetNode.dependencies.push({
                flags: cref.dependencies,
                type: 'dependsOn',
              })
            }
          }

          // Add conditional relationship to the SOURCE flag (this node), not the target
          if (cref.when) {
            node.dependencies.push({
              dependencies: cref.dependencies,
              flag: cref.flag,
              type: 'conditional',
              when: cref.when,
            })
          }
        }
      } else if (dep.type === 'conditional') {
        // For direct conditional relationships, add to the source flag (this node)
        node.dependencies.push(dep)

        // Add dependsOn to the target flag for explicit dependencies
        if (dep.dependencies && dep.dependencies.length > 0) {
          const targetNode = graph.get(dep.flag)
          if (targetNode) {
            targetNode.dependencies.push({
              flags: dep.dependencies,
              type: 'dependsOn',
            })
          }
        }
      } else {
        // All other relationships are attached to this node
        node.dependencies.push(dep)
      }
    }
  }

  return graph
}

export async function* promptGenerator(
  graph: FlagGraph,
  initialAnswers: Record<string, unknown>,
): AsyncGenerator<FlagPromptInfo> {
  // Helper: check if a flag is satisfied in answers
  function isFlagSatisfied(node: FlagNode, answers: Record<string, unknown>): boolean {
    // If the flag is present in answers, it's satisfied
    if (Object.hasOwn(answers, node.name)) {
      // Accept undefined/null as "not satisfied"
      const val = answers[node.name]
      if (val === undefined) return false
      if (Array.isArray(val)) return val.length > 0
      return true
    }

    // If the flag has a default, treat as satisfied (consumer may override this)
    if ('default' in node.definition && node.definition.default !== undefined) {
      return true
    }

    // If allowStdin: 'only', treat as satisfied (consumer will handle stdin)
    // @ts-expect-error for now
    if (node.definition.allowStdin === 'only') {
      return true
    }

    return false
  }

  // Helper: find the next available flag to prompt for
  async function findNextAvailableFlag(
    graph: FlagGraph,
    answers: Record<string, unknown>,
  ): Promise<FlagNode | undefined> {
    // Helper to check if a flag can be prompted for (dependencies are satisfied)

    // eslint-disable-next-line complexity
    async function canPromptFlag(node: FlagNode): Promise<boolean> {
      // Skip flags that read only from stdin
      // @ts-expect-error for now
      if (node.definition.allowStdin === 'only') return false

      // Skip flags that are already satisfied
      if (isFlagSatisfied(node, answers)) return false

      // Check if this flag is the target of any conditional relationships
      // If so, ensure those conditions are met before prompting
      for (const [, otherNode] of graph) {
        for (const rel of otherNode.dependencies) {
          if (rel.type === 'conditional' && rel.flag === node.name) {
            // This flag is conditionally required by another flag
            // Check if dependencies for the condition are satisfied
            if (Array.isArray(rel.dependencies)) {
              for (const dep of rel.dependencies) {
                const depNode = graph.get(dep)

                if (depNode && !isFlagSatisfied(depNode, answers)) {
                  // Dependency not satisfied, can't evaluate condition yet
                  return false
                }
              }
            }

            // Dependencies are satisfied, now check if condition is met
            if (typeof rel.when === 'function') {
              try {
                // eslint-disable-next-line no-await-in-loop
                const conditionResult = await rel.when(answers)

                if (!conditionResult) {
                  // Condition not met, this flag shouldn't be prompted
                  return false
                }
              } catch {
                // Can't evaluate condition (missing dependencies), wait
                return false
              }
            }
          }
        }
      }

      // Check if dependencies are satisfied
      for (const rel of node.dependencies) {
        switch (rel.type) {
          case 'all': {
            // For 'all' relationships, we need to check if all conditions can be satisfied
            // This means checking conditional dependencies before prompting

            for (const flagRef of rel.flags) {
              if (typeof flagRef === 'string') {
                // Simple flag reference - dependency must be satisfied
                const depNode = graph.get(flagRef)

                if (depNode && !isFlagSatisfied(depNode, answers)) return false
              }
            }

            break
          }

          case 'conditional': {
            // For conditional relationships, ensure dependencies are satisfied first
            if (Array.isArray(rel.dependencies)) {
              for (const dep of rel.dependencies) {
                const depNode = graph.get(dep)

                if (depNode && !isFlagSatisfied(depNode, answers)) return false
              }
            }

            // Only evaluate condition if dependencies are satisfied
            // eslint-disable-next-line no-await-in-loop
            if (typeof rel.when === 'function' && (await rel.when(answers))) {
              const condNode = graph.get(rel.flag)
              if (condNode && !isFlagSatisfied(condNode, answers)) return false
            }

            break
          }

          case 'dependsOn': {
            // All dependencies must be satisfied before we can prompt for this flag
            for (const dep of rel.flags) {
              const depNode = graph.get(dep)

              if (depNode && !isFlagSatisfied(depNode, answers)) return false
            }

            break
          }

          case 'some': {
            // At least one flag in the relationship must be satisfied
            // We can prompt if at least one dependency is satisfied OR could be satisfied
            const someFlags = rel.flags
              .map((f) => (typeof f === 'string' ? graph.get(f) : graph.get(f.name)))
              .filter(Boolean) as FlagNode[]
            const satisfiedCount = someFlags.filter((n) => isFlagSatisfied(n, answers)).length
            // If none are satisfied yet, we need to wait for at least one dependency
            if (satisfiedCount === 0) {
              return false
            }

            break
          }

          // For other relationship types, we can prompt and let validation handle conflicts
          default: {
            break
          }
        }
      }

      return true
    }

    // Priority order: required flags first, then others
    const nodes = [...graph.values()]

    // First pass: required flags that can be prompted
    for (const node of nodes) {
      // eslint-disable-next-line no-await-in-loop
      if ((await canPromptFlag(node)) && node.dependencies.some((r) => r.type === 'required')) {
        return node
      }
    }

    // Second pass: any other flag that can be prompted
    for (const node of nodes) {
      // eslint-disable-next-line no-await-in-loop
      if (await canPromptFlag(node)) {
        return node
      }
    }

    return undefined
  }

  // The generator implementation
  const answers = {...initialAnswers}

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const node = await findNextAvailableFlag(graph, answers)
    if (!node) break

    // Yield the next flag to prompt for
    const promptInfo: FlagPromptInfo = {
      definition: node.definition,
      name: node.name,
    }
    // Yield and receive the answer from the consumer
    const input = yield promptInfo
    // Consumer is responsible for validation, so we just store the answer
    // If input is undefined, consumer chose to skip this flag
    if (input !== undefined) {
      answers[node.name] = input
    }
  }
}

// TODO: Use this to get the defaults for the flags so we can pass them to the client
export async function preparse<
  TFlags extends OutputFlags<any>,
  BFlags extends OutputFlags<any>,
  TArgs extends OutputArgs<any>,
>(argv: string[], options: Input<TFlags, BFlags, TArgs>): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
  const parsed = await parse(argv, options, false)
  console.log(parsed)
  return parsed
}
