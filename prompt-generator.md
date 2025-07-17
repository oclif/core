# Interactive Flag Prompting & Dependency Resolution

\*Draft specification – **please review the open questions called‐out in the last section.\***

## Problem Statement

Users often run a command without providing every flag.
oclif currently throws if required / relationship constraints are not satisfied.
We want to offer a fully interactive experience that:

1. Looks at the _static_ flag metadata declared on the command (`dependsOn`, `exclusive`, `exactlyOne`, `relationships`, `required`, `default`, etc.).
2. Builds an _in-memory dependency graph_ of those relationships.
3. Prompts the user for the **minimal** next flag value needed to move the graph to a _valid_ state.
   After each answer the graph is recalculated so that conditional rules (`when`) are respected.
4. Repeats until all constraints are met, then calls the regular `Command.parse` flow with the
   collected answers.

## High-level Behavior

```
$ mycli hello world --interactive
? required-flag: ………………………………
? conditional-trigger (met/unmet): met
? conditional-b: ………………………………
? conditional-a: ………………………………
✔ All flags valid – running command
hello world! (./src/commands/hello/world.ts)
```

- If the user passed some flags on the CLI, they become the **initial** data set; only the
  remaining necessary flags are prompted.
- Default values are **not** prompted unless the user chooses to override them
  (`--interactive --include-defaults` TBD).
- If the graph can be satisfied in multiple ways (e.g. _exactly-one_ relationships) the engine
  asks the _smallest_ set of follow-up questions (heuristic: favor flags that have
  `options` → list prompt > boolean confirm > free text input).

## Architectural Overview

```
                     +-----------------------------+
                     | Command.<static> flags      |
                     +--------------+--------------+
                                    |
                        buildFlagDependencyGraph()
                                    |
                     +--------------v--------------+
                     |  FlagGraph (acyclic DAG)    |
                     +--------------+--------------+
                                    |
               +--------------------v--------------------+
               | promptGenerator() (async generator)     |
               +--------------------+--------------------+
                                    |
                                    v
                          Consumer Implementation
```

### New APIs in `src/command.ts`

1. **`buildFlagDependencyGraph(flags: FlagInput): FlagGraph`**
   _Pure_ function that converts oclif flag metadata into a canonical graph shape:

   ```ts
   type FlagRelationship =
     | {type: 'required'}
     | {type: 'dependsOn'; flags: string[]}
     | {type: 'exactlyOne'; flags: string[]}
     | {type: 'exclusive'; flags: string[]}
     | {type: 'all' | 'some' | 'none'; flags: (string | FlagReference)[]}
     | {type: 'conditional'; flag: string; when: (answers: Record<string, any>) => boolean; dependencies?: string[]}

   // FlagReference allows for explicit dependency declarations in relationships
   type FlagReference =
     | string
     | {
         name: string
         when: (flags: Record<string, unknown>) => Promise<boolean>
         dependencies?: string[]
       }

   type FlagNode = {
     name: string
     definition: Flag.Cached | Flag
     relationships: FlagRelationship[]
   }

   export type FlagGraph = Map<string, FlagNode>

   type FlagPromptInfo = {
     name: string
     // Flag definition contains all the metadata needed to prompt the user (default value, parse function, multiple, etc)
     definition: Flag.Cached | Flag
   }
   ```

   The `dependencies` property in conditional `FlagReference` objects allows explicit declaration of flags that must be satisfied before evaluating conditional logic. This eliminates the need to parse `when` function implementations to determine dependencies.

   **Example flag definition:**

   ```ts
   static flags = {
     'conditional-flag': Flags.string({
       description: 'Conditionally depends on target-flag when trigger is "met"',
       relationships: [{
         type: 'all',
         flags: [{
           name: 'target-flag',
           dependencies: ['trigger-flag'], // Explicit dependency declaration
           when: async (flags) => flags['trigger-flag'] === 'met'
         }]
       }]
     })
   }
   ```

   **Dependency resolution behavior:**
   - `trigger-flag` must be prompted/satisfied first
   - Only after `trigger-flag` is satisfied can the `when` function be evaluated
   - If `when` returns `true`, `target-flag` becomes required and will be prompted
   - Finally, `conditional-flag` can be prompted (since its dependencies are satisfied)

   This ensures proper dependency ordering without regex parsing of function implementations, making the dependency graph more reliable and explicit.

2. **`async *promptGenerator(graph, initialAnswers): AsyncGenerator<FlagPromptInfo>`**
   Yields flags that can be prompted for, in dependency order.
   • Consumes answers via `next(answer)` and re-evaluates the graph.
   • Continues through all valid flags, not just required ones.
   • Consumer can exit early when they have sufficient answers.
   • Each yielded `FlagPromptInfo` includes the flag definition.

### Usage in Client Commands (`flag-graph/src/commands/hello/world.ts`)

```ts
export default class World extends Command {
  static flags = { … }           // unchanged
  async run() {
    // Consumer is responsible for implementing their own prompting logic
    const graph = this.buildFlagDependencyGraph(this.constructor.flags)
    const initialAnswers = this.parsePartialFlags(this.argv) // hypothetical helper

    // Use the graph and generator to implement custom prompting
    const promptGen = this.promptGenerator(graph, initialAnswers)
    const answers = await this.customPromptingLogic(promptGen) // consumer implementation

    // Merge answers back into argv for downstream parsing / business logic
    this.argv = [...this.argv, ...this.flagsToArgv(answers)]
    const {flags} = await this.parse(World)
    …
  }
}
```

This approach keeps @oclif/core UX-agnostic while providing the dependency resolution primitives that consumers need.

### Expected Implementation of `customPromptingLogic`

The `customPromptingLogic` method is expected to:

1. **Iterate through the async generator**: Use a `for await` loop to process each `FlagPromptInfo` yielded by the generator
2. **Map flag definitions to prompts**: Convert oclif flag metadata to prompting library format (see mapping table below)
3. **Display prompts to user**: Use their preferred prompting library (@inquirer/prompts, prompts, etc.)
4. **Send answers back**: Call `promptGen.next(answer)` with the user's response to continue dependency resolution
5. **Handle completion**: Return the complete answers object when the generator finishes

```ts
async customPromptingLogic(promptGen: AsyncGenerator<FlagPromptInfo>): Promise<Record<string, any>> {
  const answers: Record<string, any> = {}

  for await (const flagInfo of promptGen) {
    // Check if we want to prompt for this flag
    if (this.shouldSkipFlag(flagInfo, answers)) {
      // Skip this flag, send undefined to continue
      await promptGen.next(undefined)
      continue
    }

    const prompt = this.flagToPrompt(flagInfo) // Convert to prompting library format
    const answer = await prompt() // Show prompt to user

    answers[flagInfo.name] = answer
    // Send answer back to generator to update dependency graph
    await promptGen.next(answer)

    // Consumer can decide when to stop prompting
    if (this.hasEnoughAnswers(answers)) {
      break
    }
  }

  return answers
}

private shouldSkipFlag(flagInfo: FlagPromptInfo, answers: Record<string, any>): boolean {
  // Skip flags that already have values
  if (answers[flagInfo.name] !== undefined) return true

  // Skip flags with defaults if user doesn't want to override them
  if (flagInfo.definition.default !== undefined && !this.promptForDefaults) return true

  // Skip hidden flags unless explicitly requested
  if (flagInfo.definition.hidden && !this.includeHidden) return true

  return false
}

private hasEnoughAnswers(answers: Record<string, any>): boolean {
  // Consumer-specific logic to determine when to stop
  // e.g., stop after required flags are satisfied
  return this.isGraphSatisfied(this.graph, answers) && !this.promptForOptional
}

private flagToPrompt(flagInfo: FlagPromptInfo) {
  const {name, definition} = flagInfo

  // Example mapping for @inquirer/prompts
  if (definition.type === 'boolean') {
    return () => confirm({
      message: definition.description || `${name}?`,
      default: definition.default ?? false
    })
  }

  if (definition.options) {
    return () => select({
      message: definition.description || `${name}?`,
      choices: definition.options.map(value => ({name: value, value})),
      default: definition.default
    })
  }

  return () => input({
    message: definition.description || `${name}?`,
    default: definition.default,
    validate: async (input) => {
      try {
        await definition.parse(input, /* context */, /* opts */)
        return true
      } catch (error) {
        return error.message
      }
    }
  })
}
```

### Flag-to-Prompt Mapping (Consumer Reference)

Since @oclif/core is UX-agnostic, consumers will need to map flag definitions to their preferred prompting library. Here's a reference for common patterns:

| Flag Type / Shape               | Suggested Prompt Type     | Implementation Notes                            |
| ------------------------------- | ------------------------- | ----------------------------------------------- | ------- | ----------------------------- |
| `boolean`                       | `confirm`                 | Default = flag's `default ?? false`             |
| `option` + `options: ['a','b']` | `select` / `autocomplete` | Choices from `options`                          |
| `string                         | integer                   | custom` (no enum)                               | `input` | Validate using `flag.parse()` |
| `multiple: true`                | `checkbox / editor`       | Handle array inputs, respect `delimiter` if set |
| `allowStdin: true`              | `input` with stdin option | Allow `-` as value to read from stdin           |
| `allowStdin: 'only'`            | Auto-read from stdin      | Always read from stdin, no prompting needed     |

## Relationship Behavior Specification

This section defines the expected prompting behavior for each relationship type. Consumers should implement these behaviors to ensure consistent user experience across oclif applications.

### Core Relationship Types

#### `required`

- **Behavior**: Always prompt for input unless the flag already has a value
- **Implementation**: Flag must be prompted before any flags that depend on it
- **User Experience**: Non-optional prompt, user cannot skip
- **Example**: "Please enter a value for required-flag:"

#### `dependsOn`

- **Behavior**: Prompt for the flag first, and then require all flags it depends on to be set
- **Implementation**: Prompt the user for the flag; after receiving a value, prompt for all flags listed in its `dependsOn` array (if not already set)
- **User Experience**: User is asked for the main flag, then is required to provide values for all its dependencies
- **Example**: `flag-b` depends on `flag-a` → prompt `flag-b` first, then prompt `flag-a` (if not already set)

#### `exactlyOne`

- **Behavior**: Prompt user to select which one flag from the group to provide, then prompt for that flag's value
- **Implementation**:
  1. Show selection prompt with all flags in the group as options
  2. Prompt for the value of the selected flag
  3. Skip prompting for other flags in the group
- **User Experience**: Two-step process: selection then value input
- **Example**:
  ```
  ? Which authentication method? (exactlyOne group)
    > oauth-token
      api-key
      username-password
  ? oauth-token: <user enters token>
  ```

#### `exclusive`

- **Behavior**: Prevent prompting if any exclusive flags are already set
- **Implementation**: Check if any flags in `exclusive` array are satisfied before prompting
- **User Experience**: Automatically skip conflicting flags, optionally warn user
- **Example**: If `--prod` is set, don't prompt for `--dev` or `--staging`

### Advanced Relationship Types

#### `all`

- **Behavior**: If this flag is set, ensure all related flags are also prompted/set
- **Implementation**:
  1. Prompt for this flag first
  2. If user provides a value, prompt for all flags in the `all` group
  3. If user skips this flag, skip the entire group
- **User Experience**: Cascading prompts when the primary flag is set
- **Example**: Setting `--deploy` triggers prompts for `--environment`, `--region`, `--confirm`

#### `some`

- **Behavior**: If this flag is set, ensure at least one flag from the related group is also set
- **Implementation**:
  1. Prompt for this flag first
  2. If user provides a value, check if any flags in `some` group are satisfied
  3. If none are satisfied, prompt user to select and provide at least one
- **User Experience**: Primary flag triggers conditional group prompting
- **Example**: Setting `--notify` requires at least one of `--email`, `--slack`, `--webhook`

#### `none`

- **Behavior**: If this flag is set, ensure none of the related flags are set
- **Implementation**: Skip prompting for all flags in the `none` group if this flag is set
- **User Experience**: Setting the primary flag automatically excludes related options
- **Example**: Setting `--offline` skips prompts for `--api-endpoint`, `--sync`, `--remote-backup`

#### `conditional`

- **Behavior**: Only prompt the target flag if the condition evaluates to true
- **Implementation**:
  1. Ensure all `dependencies` are satisfied first
  2. Evaluate the `when` function with current answers
  3. Only prompt the target flag if condition returns `true`
  4. Skip target flag entirely if condition returns `false`
- **User Experience**: Dynamic prompting based on previous answers
- **Example**:
  ```
  ? deployment-type: production
  ? enable-monitoring (conditional on production): <prompted because condition met>
  ```

### Cross-Relationship Interactions

#### Multiple Relationships on Same Flag

- **Behavior**: All relationships must be satisfied simultaneously
- **Implementation**: Check each relationship type in dependency order
- **Priority Order**: `required` → `dependsOn` → `conditional` → `exactlyOne` → `exclusive` → `all`/`some`/`none`

#### Conflicting Relationships

- **Behavior**: Detect and report unsatisfiable constraint combinations
- **Examples of Conflicts**:
  - `required: true` + `exclusive` with all alternatives already set
  - `exactlyOne` group where all options are `exclusive` with already-set flags
  - `conditional` with unsatisfiable `dependencies`

#### Consumer Implementation Guidelines

1. **Validation**: Validate all relationships before starting the prompting flow
2. **Error Handling**: Provide clear error messages for unsatisfiable constraints
3. **User Feedback**: Show relationship context in prompts (e.g., "Required for deployment:")
4. **Skip Logic**: Allow users to exit prompting flow early while respecting required constraints
5. **Dependency Visualization**: Consider showing dependency relationships to users for complex flag sets

## Error Handling

- **Validation errors** inside `flag.parse` should be handled by the consumer's prompting implementation.
- Graph validation errors (unsatisfiable constraints) should be detected by the core utilities.
- Consumers are responsible for handling user interruption and exit behavior.

## Performance

- Building the graph is **O(F + R)** (flags + relationships).
- Prompt generation is lazy; only unsatisfied nodes are inspected.

## Implementation Notes

### Conditional Dependency Resolution

The enhanced dependency system uses explicit `dependencies` declarations to ensure proper prompting order for conditional relationships:

**Dependency Analysis:**

- Flags that are targets of conditional relationships are analyzed for dependencies
- Dependencies must be satisfied before the conditional logic (`when` function) is evaluated
- If dependencies are not met, the target flag cannot be prompted
- Only when dependencies are satisfied and the condition evaluates to `true` will the target flag be prompted

**Implementation Details:**

- `buildFlagDependencyGraph()` extracts `dependencies` from `FlagReference` objects and creates explicit `dependsOn` relationships
- `promptGenerator()` checks both outgoing dependencies (what this flag needs) and incoming conditional relationships (what conditionally needs this flag)
- Conditional evaluation is deferred until all dependencies are satisfied, ensuring reliable dependency ordering

**Example Flow:**

```
conditional-a → depends on conditional-b (when conditional-trigger === 'met')
             → depends on conditional-trigger (explicit dependency)

Resolution order:
1. conditional-trigger (no dependencies)
2. Evaluate: conditional-trigger === 'met' ?
   - If true: conditional-b becomes available for prompting
   - If false: conditional-b is skipped entirely
3. conditional-a (after all its dependencies are satisfied)
```

### Prompting Strategy

The `promptGenerator` iterates through all flags in dependency-safe order, allowing consumers maximum flexibility:

**Generator Behavior:**

- Yields flags in dependency order (required flags first, then optional)
- Continues through all valid flags, not just minimally required ones
- Consumer controls when to stop by breaking from the iteration
- Consumer can skip individual flags by sending `undefined` to `next()`

**Consumer Control:**

- Skip flags with default values unless overriding is desired
- Skip hidden flags unless explicitly requested
- Stop after required constraints are met, or continue for optional flags
- Implement custom logic for determining when enough answers have been collected

### Flag Defaults

Flag defaults should be passed through to the consumer so they can be provided to their prompting library. This allows the consumer to decide whether to:

- Skip prompting entirely for flags with defaults
- Show prompts with the default value pre-filled
- Allow users to override defaults when desired

### Multiple Value Flags

Flags with `multiple: true` require special handling:

- The `multiple` property indicates the flag accepts multiple values
- The `delimiter` property (if set) specifies how to split multiple values from a single input
- Consumers should handle array inputs and may need to implement multi-step prompting or specialized UI components

### Stdin Flags

Flags with `allowStdin` require special consideration:

- `allowStdin: true` allows `-` as a value to read from stdin, but normal prompting should occur otherwise
- `allowStdin: 'only'` means the flag always reads from stdin and should not be prompted for
- Consumers should check for stdin availability in non-TTY environments

The `promptGenerator` should include all relevant flag metadata so consumers have complete information for implementing appropriate prompting behavior.
