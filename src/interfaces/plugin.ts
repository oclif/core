import {Command} from './command'
import {PJSON} from './pjson'
import {Topic} from './topic'

export interface PluginOptions {
  root: string;
  name?: string;
  type?: string;
  tag?: string;
  ignoreManifest?: boolean;
  errorOnManifestCreate?: boolean;
  parent?: Plugin;
  children?: Plugin[];
}

export interface Options extends PluginOptions {
  devPlugins?: boolean;
  userPlugins?: boolean;
  channel?: string;
  version?: string;
}
export interface Plugin {
  /**
   * ../config version
   */
  _base: string;
  /**
   * name from package.json
   */
  name: string;
  /**
   * aliases from package.json dependencies
   */
  alias: string;
  /**
   * version from package.json
   *
   * example: 1.2.3
   */
  version: string;
  /**
   * full package.json
   *
   * parsed with read-pkg
   */
  pjson: PJSON.Plugin | PJSON.CLI;
  /**
   * used to tell the user how the plugin was installed
   * examples: core, link, user, dev
   */
  type: string;
  /**
   * base path of plugin
   */
  root: string;
  /**
   * npm dist-tag of plugin
   * only used for user plugins
   */
  tag?: string;
  /**
   * if it appears to be an npm package but does not look like it's really a CLI plugin, this is set to false
   */
  valid: boolean;

  commands: Command.Plugin[];
  hooks: { [k: string]: string[] };
  readonly commandIDs: string[];
  readonly topics: Topic[];

  findCommand(id: string, opts: { must: true }): Promise<Command.Class>;
  findCommand(id: string, opts?: { must: boolean }): Promise<Command.Class> | undefined;
  load(): Promise<void>;
}
