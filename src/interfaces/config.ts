import {PJSON} from './pjson'
import {Hooks, Hook} from './hooks'
import {Plugin, Options} from './plugin'
import {Topic} from './topic'
import {Command} from '../command'

export type LoadOptions = Options | string | Config | undefined
export type PlatformTypes = 'darwin' | 'linux' | 'win32' | 'aix' | 'freebsd' | 'openbsd' | 'sunos' | 'wsl'
export type ArchTypes = 'arm' | 'arm64' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64' | 'x86'

export type PluginVersionDetail = {
  version: string;
  type: string;
  root: string
};

export type VersionDetails = {
  cliVersion: string;
  architecture: string;
  nodeVersion: string;
  pluginVersions?: Record<string, PluginVersionDetail>;
  osVersion?: string;
  shell?: string;
  rootPath?: string;
}

export interface Config {
  name: string;
  version: string;
  channel: string;
  pjson: PJSON.CLI;
  root: string;
  /**
   * process.arch
   */
  arch: ArchTypes;
  /**
   * bin name of CLI command
   */
  bin: string;
  /**
   * cache directory to use for CLI
   *
   * example ~/Library/Caches/mycli or ~/.cache/mycli
   */
  cacheDir: string;
  /**
   * config directory to use for CLI
   *
   * example: ~/.config/mycli
   */
  configDir: string;
  /**
   * data directory to use for CLI
   *
   * example: ~/.local/share/mycli
   */
  dataDir: string;
  /**
   * base dirname to use in cacheDir/configDir/dataDir
   */
  dirname: string;
  /**
   * points to a file that should be appended to for error logs
   *
   * example: ~/Library/Caches/mycli/error.log
   */
  errlog: string;
  /**
   * path to home directory
   *
   * example: /home/myuser
   */
  home: string;
  /**
   * process.platform
   */
  platform: PlatformTypes;
  /**
   * active shell
   */
  shell: string;
  /**
   * user agent to use for http calls
   *
   * example: mycli/1.2.3 (darwin-x64) node-9.0.0
   */
  userAgent: string;
  /**
   * if windows
   */
  windows: boolean;
  /**
   * debugging level
   *
   * set by ${BIN}_DEBUG or DEBUG=$BIN
   */
  debug: number;
  /**
   * npm registry to use for installing plugins
   */
  npmRegistry?: string;
  plugins: Plugin[];
  binPath?: string;
  /**
   * name of any bin aliases that will execute the cli
   */
  binAliases?: string[];
  nsisCustomization?: string;
  valid: boolean;
  flexibleTaxonomy?: boolean;
  topicSeparator: ':' | ' ';
  readonly commands: Command.Loadable[];
  readonly topics: Topic[];
  readonly commandIDs: string[];
  readonly versionDetails: VersionDetails

  runCommand<T = unknown>(id: string, argv?: string[], cachedCommand?: Command.Loadable): Promise<T>;
  runHook<T extends keyof Hooks>(event: T, opts: Hooks[T]['options'], timeout?: number, captureErrors?: boolean): Promise<Hook.Result<Hooks[T]['return']>>;
  getAllCommandIDs(): string[]
  getAllCommands(): Command.Loadable[]
  findCommand(id: string, opts: { must: true }): Command.Loadable;
  findCommand(id: string, opts?: { must: boolean }): Command.Loadable | undefined;
  findTopic(id: string, opts: { must: true }): Topic;
  findTopic(id: string, opts?: { must: boolean }): Topic | undefined;
  findMatches(id: string, argv: string[]): Command.Loadable[];
  scopedEnvVar(key: string): string | undefined;
  scopedEnvVarKey(key: string): string;
  scopedEnvVarKeys(key: string): string[];
  scopedEnvVarTrue(key: string): boolean;
  s3Url(key: string): string;
  s3Key(type: 'versioned' | 'unversioned', ext: '.tar.gz' | '.tar.xz', options?: Config.s3Key.Options): string;
  s3Key(type: keyof PJSON.S3.Templates, options?: Config.s3Key.Options): string;
  getPluginsList(): Plugin[];
}

export namespace Config {
  export namespace s3Key {
    export interface Options {
      platform?: PlatformTypes;
      arch?: ArchTypes;
      [key: string]: any;
    }
  }
}
