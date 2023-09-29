import {Command} from '../command'
import {PJSON} from './pjson'
import {Topic} from './topic'

export interface PluginOptions {
  root: string
  name?: string
  type?: string
  tag?: string
  ignoreManifest?: boolean
  errorOnManifestCreate?: boolean
  respectNoCacheDefault?: boolean
  parent?: Plugin
  children?: Plugin[]
  flexibleTaxonomy?: boolean
  isRoot?: boolean
}

export interface Options extends PluginOptions {
  devPlugins?: boolean
  jitPlugins?: boolean
  userPlugins?: boolean
  channel?: string
  version?: string
  enablePerf?: boolean
  plugins?: Map<string, Plugin>
}

export interface Plugin {
  /**
   * ../config version
   */
  _base: string
  /**
   * name from package.json
   */
  name: string
  /**
   * aliases from package.json dependencies
   */
  alias: string
  /**
   * version from package.json
   *
   * example: 1.2.3
   */
  version: string
  /**
   * full package.json
   *
   * parsed with read-pkg
   */
  pjson: PJSON.Plugin | PJSON.CLI
  /**
   * used to tell the user how the plugin was installed
   * examples: core, link, user, dev
   */
  type: string
  /**
   * Plugin is written in ESM or CommonJS
   */
  moduleType: 'module' | 'commonjs'
  /**
   * base path of plugin
   */
  root: string
  /**
   * npm dist-tag of plugin
   * only used for user plugins
   */
  tag?: string
  /**
   * if it appears to be an npm package but does not look like it's really a CLI plugin, this is set to false
   */
  valid: boolean

  /**
   * True if the plugin is the root plugin.
   */
  isRoot: boolean

  commands: Command.Loadable[]
  hooks: {[k: string]: string[]}
  readonly commandIDs: string[]
  readonly topics: Topic[]
  readonly hasManifest: boolean

  findCommand(id: string, opts: {must: true}): Promise<Command.Class>
  findCommand(id: string, opts?: {must: boolean}): Promise<Command.Class> | undefined
  load(): Promise<void>
}
