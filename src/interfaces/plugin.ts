import {Command} from '../command'
import {PJSON} from './pjson'
import {Topic} from './topic'

export interface PluginOptions {
  children?: Plugin[]
  errorOnManifestCreate?: boolean
  flexibleTaxonomy?: boolean
  ignoreManifest?: boolean
  isRoot?: boolean
  name?: string
  parent?: Plugin
  respectNoCacheDefault?: boolean
  root: string
  tag?: string
  type?: string
}

export interface Options extends PluginOptions {
  channel?: string
  devPlugins?: boolean
  enablePerf?: boolean
  jitPlugins?: boolean
  plugins?: Map<string, Plugin>
  userPlugins?: boolean
  version?: string
}

export interface Plugin {
  /**
   * ../config version
   */
  _base: string
  /**
   * aliases from package.json dependencies
   */
  alias: string
  readonly commandIDs: string[]
  commands: Command.Loadable[]
  findCommand(id: string, opts: {must: true}): Promise<Command.Class>
  findCommand(id: string, opts?: {must: boolean}): Promise<Command.Class> | undefined
  readonly hasManifest: boolean
  hooks: {[k: string]: string[]}
  /**
   * True if the plugin is the root plugin.
   */
  isRoot: boolean
  load(): Promise<void>

  /**
   * Plugin is written in ESM or CommonJS
   */
  moduleType: 'commonjs' | 'module'

  /**
   * name from package.json
   */
  name: string
  /**
   * full package.json
   *
   * parsed with read-pkg
   */
  pjson: PJSON.CLI | PJSON.Plugin
  /**
   * base path of plugin
   */
  root: string
  /**
   * npm dist-tag of plugin
   * only used for user plugins
   */
  tag?: string
  readonly topics: Topic[]

  /**
   * used to tell the user how the plugin was installed
   * examples: core, link, user, dev
   */
  type: string
  /**
   * if it appears to be an npm package but does not look like it's really a CLI plugin, this is set to false
   */
  valid: boolean
  /**
   * version from package.json
   *
   * example: 1.2.3
   */
  version: string
}
