import {HelpOptions} from './help'

export type CommandDiscovery = {
  /**
   * The strategy to use for loading commands.
   *
   * - `pattern` will use glob patterns to find command files in the specified `target`.
   * - `explicit` will use `import` (or `require` for CJS) to load the commands from the
   *    specified `target`.
   * - `single` will use the `target` which should export a command class. This is for CLIs that
   *    only have a single command.
   *
   * In both cases, the `oclif.manifest.json` file will be used to find the commands if it exists.
   */
  strategy: 'pattern' | 'explicit' | 'single'
  /**
   * If the `strategy` is `pattern`, this is the **directory** to use to find command files.
   *
   * If the `strategy` is `explicit`, this is the **file** that exports the commands.
   *   - This export must be an object with keys that are the command names and values that are the command classes.
   *   - Unless `identifier` is specified, the default export will be used.
   *
   * @example
   * ```typescript
   * // in src/commands.ts
   * import {Command} from '@oclif/core'
   * import Hello from './commands/hello/index.js'
   * import HelloWorld from './commands/hello/world.js'
   *
   * export default {
   *   hello: Hello,
   *   'hello:world': HelloWorld,
   * } satisfies Record<string, Command.Class>
   * ```
   */
  target: string
  /**
   * The glob patterns to use to find command files when no `oclif.manifest.json` is present.
   * This is only used when `strategy` is `pattern`.
   */
  globPatterns?: string[]
  /**
   * The name of the export to used when loading the command object from the `target` file. Only
   * used when `strategy` is `explicit`. Defaults to `default`.
   *
   * @example
   * ```typescript
   * // in src/commands.ts
   * import {Command} from '@oclif/core'
   * import Hello from './commands/hello/index.js'
   * import HelloWorld from './commands/hello/world.js'
   *
   * export const MY_COMMANDS = {
   *  hello: Hello,
   * 'hello:world': HelloWorld,
   * } satisfies Record<string, Command.Class>
   * ```
   *
   * In the package.json:
   * ```json
   * {
   *  "oclif": {
   *   "commands": {
   *     "strategy": "explicit",
   *     "target": "./dist/index.js",
   *     "identifier": "MY_COMMANDS"
   *    }
   * }
   * ```
   */
  identifier?: string
}

export type HookOptions = {
  /**
   * The file path containing hook.
   */
  target: string
  /**
   * The name of the export to use when loading the hook function from the `target` file. Defaults to `default`.
   */
  identifier: string
}

export type S3Templates = {
  baseDir?: string
  manifest?: string
  unversioned?: string
  versioned?: string
}

export type S3 = {
  acl?: string
  bucket?: string
  folder?: string
  gz?: boolean
  host?: string
  templates: {
    target: S3Templates
    vanilla: S3Templates
  }
  xz?: boolean
}

export type Configuration = {
  additionalHelpFlags?: string[]
  additionalVersionFlags?: string[]
  aliases?: {[name: string]: null | string}
  bin?: string
  binAliases?: string[]
  commands?: string | CommandDiscovery
  description?: string
  devPlugins?: string[]
  dirname?: string
  examplePlugin?: string
  exitCodes?: {
    default?: number
    failedFlagParsing?: number
    failedFlagValidation?: number
    invalidArgsSpec?: number
    nonExistentFlag?: number
    requiredArgs?: number
    unexpectedArgs?: number
  }
  flexibleTaxonomy?: boolean
  helpClass?: string
  helpOptions?: HelpOptions
  hooks?: {[name: string]: string | string[] | HookOptions | HookOptions[]}
  jitPlugins?: Record<string, string>
  macos?: {
    identifier?: string
    sign?: string
  }
  npmRegistry?: string
  nsisCustomization?: string
  pluginPrefix?: string
  plugins?: string[]
  repositoryPrefix?: string
  schema?: number
  state?: 'beta' | 'deprecated' | string
  theme?: string
  topicSeparator?: ' ' | ':'
  topics?: {
    [k: string]: {
      description?: string
      hidden?: boolean
      subtopics?: Configuration['topics']
    }
  }
  update?: {
    autoupdate?: {
      debounce?: number
      rollout?: number
    }
    node: {
      targets?: string[]
      version?: string
      options?: string | string[]
    }
    s3: S3
  }
  'warn-if-update-available'?: {
    authorization: string
    message: string
    registry: string
    timeoutInDays: number
    frequency: number
    frequencyUnit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
  }
  windows?: {
    homepage?: string
    keypath?: string
    name?: string
  }
}

export type UserPlugin = {
  name: string
  tag?: string
  type: 'user'
  url?: string
}

export type LinkedPlugin = {
  name: string
  root: string
  type: 'link'
}

export type PluginTypes = {root: string} | UserPlugin | LinkedPlugin

export type UserPJSON = {
  oclif: {
    plugins?: PluginTypes[]
  }
  private?: boolean
}

export type PJSON = {
  [k: string]: any
  dependencies?: {[name: string]: string}
  devDependencies?: {[name: string]: string}
  name: string
  oclif: Configuration
  version: string
}
