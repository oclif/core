import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {Config} from './config/config'
import {OclifConfiguration, Plugin} from './interfaces'

type CacheContents = {
  rootPlugin: Plugin
  config: Config
  exitCodes: OclifConfiguration['exitCodes']
  '@oclif/core': OclifCoreInfo
}

type OclifCoreInfo = {name: string; version: string}

type ValueOf<T> = T[keyof T]

/**
 * A simple cache for storing values that need to be accessed globally.
 */
export default class Cache extends Map<keyof CacheContents, ValueOf<CacheContents>> {
  static instance: Cache

  public constructor() {
    super()
    this.set('@oclif/core', this.getOclifCoreMeta())
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }

    return Cache.instance
  }

  public get(_key: 'config'): Config | undefined
  public get(_key: '@oclif/core'): OclifCoreInfo
  public get(_key: 'rootPlugin'): Plugin | undefined
  public get(_key: 'exitCodes'): OclifConfiguration['exitCodes'] | undefined
  public get(key: keyof CacheContents): ValueOf<CacheContents> | undefined {
    return super.get(key)
  }

  private getOclifCoreMeta(): OclifCoreInfo {
    try {
      return {name: '@oclif/core', version: require('@oclif/core/package.json').version}
    } catch {
      try {
        return {
          name: '@oclif/core',
          version: JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version,
        }
      } catch {
        return {name: '@oclif/core', version: 'unknown'}
      }
    }
  }
}
