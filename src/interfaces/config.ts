import * as Color from 'color'

import {Command} from '../command'
import {Hook, Hooks} from './hooks'
import {PJSON} from './pjson'
import {Options, Plugin} from './plugin'
import {Topic} from './topic'

export type LoadOptions = Config | Options | string | undefined
export type PlatformTypes = 'wsl' | NodeJS.Platform
export type ArchTypes = 'arm' | 'arm64' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64' | 'x86'

export type PluginVersionDetail = {
  root: string
  type: string
  version: string
}

export type VersionDetails = {
  architecture: string
  cliVersion: string
  nodeVersion: string
  osVersion?: string
  pluginVersions?: Record<string, PluginVersionDetail>
  rootPath?: string
  shell?: string
}

export const THEME_KEYS = [
  'alias',
  'bin',
  'command',
  'commandSummary',
  'dollarSign',
  'flag',
  'flagDefaultValue',
  'flagOptions',
  'flagRequired',
  'flagSeparator',
  'flagType',
  'sectionDescription',
  'sectionHeader',
  'topic',
  'version',
]

export type Theme = Record<string, Color>

export interface Config {
  /**
   * process.arch
   */
  readonly arch: ArchTypes
  /**
   * bin name of CLI command
   */
  readonly bin: string
  /**
   * name of any bin aliases that will execute the cli
   */
  readonly binAliases?: string[]
  readonly binPath?: string
  /**
   * cache directory to use for CLI
   *
   * example ~/Library/Caches/mycli or ~/.cache/mycli
   */
  readonly cacheDir: string
  readonly channel: string
  readonly commandIDs: string[]
  readonly commands: Command.Loadable[]
  /**
   * config directory to use for CLI
   *
   * example: ~/.config/mycli
   */
  readonly configDir: string
  /**
   * data directory to use for CLI
   *
   * example: ~/.local/share/mycli
   */
  readonly dataDir: string
  /**
   * debugging level
   *
   * set by ${BIN}_DEBUG or DEBUG=$BIN
   */
  readonly debug: number
  /**
   * base dirname to use in cacheDir/configDir/dataDir
   */
  readonly dirname: string
  /**
   * points to a file that should be appended to for error logs
   *
   * example: ~/Library/Caches/mycli/error.log
   */
  readonly errlog: string
  findCommand(id: string, opts: {must: true}): Command.Loadable
  findCommand(id: string, opts?: {must: boolean}): Command.Loadable | undefined
  findMatches(id: string, argv: string[]): Command.Loadable[]
  findTopic(id: string, opts: {must: true}): Topic
  findTopic(id: string, opts?: {must: boolean}): Topic | undefined
  readonly flexibleTaxonomy?: boolean
  getAllCommandIDs(): string[]
  getAllCommands(): Command.Loadable[]
  getPluginsList(): Plugin[]
  /**
   * path to home directory
   *
   * example: /home/myuser
   */
  readonly home: string
  readonly name: string
  /**
   * npm registry to use for installing plugins
   */
  readonly npmRegistry?: string
  readonly nsisCustomization?: string
  readonly pjson: PJSON.CLI
  /**
   * process.platform
   */
  readonly platform: PlatformTypes
  readonly plugins: Map<string, Plugin>
  readonly root: string

  runCommand<T = unknown>(id: string, argv?: string[], cachedCommand?: Command.Loadable): Promise<T>
  runHook<T extends keyof Hooks>(
    event: T,
    opts: Hooks[T]['options'],
    timeout?: number,
    captureErrors?: boolean,
  ): Promise<Hook.Result<Hooks[T]['return']>>
  s3Key(type: 'unversioned' | 'versioned', ext: '.tar.gz' | '.tar.xz', options?: Config.s3Key.Options): string
  s3Key(type: keyof PJSON.S3.Templates, options?: Config.s3Key.Options): string
  s3Url(key: string): string
  scopedEnvVar(key: string): string | undefined
  scopedEnvVarKey(key: string): string
  scopedEnvVarKeys(key: string): string[]
  scopedEnvVarTrue(key: string): boolean
  /**
   * active shell
   */
  readonly shell: string
  readonly theme?: Theme
  topicSeparator: ' ' | ':'
  readonly topics: Topic[]
  /**
   * user agent to use for http calls
   *
   * example: mycli/1.2.3 (darwin-x64) node-9.0.0
   */
  readonly userAgent: string
  readonly valid: boolean
  readonly version: string
  readonly versionDetails: VersionDetails
  /**
   * if windows
   */
  readonly windows: boolean
}

export namespace Config {
  export namespace s3Key {
    export interface Options {
      [key: string]: any
      arch?: ArchTypes
      platform?: PlatformTypes
    }
  }
}
