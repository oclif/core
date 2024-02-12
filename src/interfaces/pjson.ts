import {HelpOptions} from './help'

export interface PJSON {
  [k: string]: any
  dependencies?: {[name: string]: string}
  devDependencies?: {[name: string]: string}
  oclif: {
    bin?: string
    dirname?: string
    hooks?: Record<string, string | string[]>
    plugins?: string[]
    schema?: number
  }
  version: string
}

export type CommandDiscovery = {
  /**
   * The strategy to use for loading commands.
   *
   * - `pattern` will use glob patterns to find command files in the specified `directory`.
   * - `explicit` will use `import` (or `require` for CJS) to load the commands from the
   *    specified `file`.
   *
   * In both cases, the `oclif.manifest.json` file will be used to find the commands if it exists.
   */
  strategy: 'pattern' | 'explicit'
  /**
   * If the `strategy` is `pattern`, this is the **directory** to use to find command files.
   *
   * If the `strategy` is `explicit`, this is the **file** that default exports the commands.
   *   - This export must be the default export and an object with keys that are the command names
   *     and values that are the command classes.
   *
   * @example
   * ```typescript
   * // in src/commands.ts
   * import Hello from './commands/hello/index.js'
   * import HelloWorld from './commands/hello/world.js'
   *
   * export default {
   *   hello: Hello,
   *   'hello:world': HelloWorld,
   * }
   * ```
   */
  target: string
  /**
   * The glob patterns to use to find command files when no `oclif.manifest.json` is present.
   * This is only used when `strategy` is `pattern`.
   */
  globPatterns?: string[]
}

export namespace PJSON {
  export interface Plugin extends PJSON {
    name: string
    oclif: PJSON['oclif'] & {
      additionalHelpFlags?: string[]
      additionalVersionFlags?: string[]
      aliases?: {[name: string]: null | string}
      commands?: string | CommandDiscovery
      default?: string
      description?: string
      devPlugins?: string[]
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
      hooks?: {[name: string]: string | string[]}
      jitPlugins?: Record<string, string>
      macos?: {
        identifier?: string
        sign?: string
      }
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
          subtopics?: Plugin['oclif']['topics']
        }
      }
      update: {
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
      windows?: {
        homepage?: string
        keypath?: string
        name?: string
      }
    }
    version: string
  }

  export interface S3 {
    acl?: string
    bucket?: string
    folder?: string
    gz?: boolean
    host?: string
    templates: {
      target: S3.Templates
      vanilla: S3.Templates
    }
    xz?: boolean
  }

  export namespace S3 {
    export interface Templates {
      baseDir?: string
      manifest?: string
      unversioned?: string
      versioned?: string
    }
  }

  export interface CLI extends Plugin {
    oclif: Plugin['oclif'] & {
      bin?: string
      binAliases?: string[]
      dirname?: string
      flexibleTaxonomy?: boolean
      jitPlugins?: Record<string, string>
      npmRegistry?: string
      nsisCustomization?: string
      schema?: number
      scope?: string
      pluginPrefix?: string
      'warn-if-update-available'?: {
        authorization: string
        message: string
        registry: string
        timeoutInDays: number
        frequency: number
        frequencyUnit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
      }
    }
  }

  export interface User extends PJSON {
    oclif: PJSON['oclif'] & {
      plugins?: (PluginTypes.Link | PluginTypes.User | string)[]
    }
    private?: boolean
  }

  export type PluginTypes = {root: string} | PluginTypes.Link | PluginTypes.User
  export namespace PluginTypes {
    export interface User {
      name: string
      tag?: string
      type: 'user'
      url?: string
    }
    export interface Link {
      name: string
      root: string
      type: 'link'
    }
  }
}
