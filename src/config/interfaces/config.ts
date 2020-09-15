import {PJSON} from './pjson'
import {Hooks} from './hooks'
import {Command} from './command'
import {IPlugin, Options} from './plugin'
import {Topic} from './topic'

export type LoadOptions = Options | string | IConfig | undefined
export type PlatformTypes = 'darwin' | 'linux' | 'win32' | 'aix' | 'freebsd' | 'openbsd' | 'sunos' | 'wsl'
export type ArchTypes = 'arm' | 'arm64' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64' | 'x86'

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IConfig {
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
  userPJSON?: PJSON.User;
  plugins: IPlugin[];
  binPath?: string;
  valid: boolean;
  readonly commands: Command.Plugin[];
  readonly topics: Topic[];
  readonly commandIDs: string[];

  runCommand(id: string, argv?: string[]): Promise<void>;
  runHook<T extends Hooks, K extends Extract<keyof T, string>>(event: K, opts: T[K]): Promise<void>;
  findCommand(id: string, opts: { must: true }): Command.Plugin;
  findCommand(id: string, opts?: { must: boolean }): Command.Plugin | undefined;
  findTopic(id: string, opts: { must: true }): Topic;
  findTopic(id: string, opts?: { must: boolean }): Topic | undefined;
  scopedEnvVar(key: string): string | undefined;
  scopedEnvVarKey(key: string): string;
  scopedEnvVarTrue(key: string): boolean;
  s3Url(key: string): string;
  s3Key(type: 'versioned' | 'unversioned', ext: '.tar.gz' | '.tar.xz', options?: IConfig.s3Key.Options): string;
  s3Key(type: keyof PJSON.S3.Templates, options?: IConfig.s3Key.Options): string;
}

export namespace IConfig {
  export namespace s3Key {
    export interface Options {
      platform?: PlatformTypes;
      arch?: ArchTypes;
      [key: string]: any;
    }
  }
}
