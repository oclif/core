import {Theme} from './config'
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

export namespace PJSON {
  export interface Plugin extends PJSON {
    name: string
    oclif: PJSON['oclif'] & {
      additionalHelpFlags?: string[]
      additionalVersionFlags?: string[]
      aliases?: {[name: string]: null | string}
      commands?: string
      default?: string
      description?: string
      devPlugins?: string[]
      flexibleTaxonomy?: boolean
      helpClass?: string
      helpOptions?: HelpOptions
      hooks?: {[name: string]: string | string[]}
      jitPlugins?: Record<string, string>
      macos?: {
        identifier?: string
        sign?: string
      }
      windows?: {
        homepage?: string
        keypath?: string
        name?: string
      }
      plugins?: string[]
      repositoryPrefix?: string
      schema?: number
      state?: 'beta' | 'deprecated' | string
      theme?: Theme
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
        }
        s3: S3
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
