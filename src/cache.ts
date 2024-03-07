import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {PJSON, Plugin} from './interfaces'

type OclifCoreInfo = {name: string; version: string}

type CacheContents = {
  rootPlugin: Plugin
  exitCodes: PJSON.Plugin['oclif']['exitCodes']
  '@oclif/core': OclifCoreInfo
}

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

  public get(key: '@oclif/core'): OclifCoreInfo
  public get(key: 'rootPlugin'): Plugin | undefined
  public get(key: 'exitCodes'): PJSON.Plugin['oclif']['exitCodes'] | undefined
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
          version: JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')),
        }
      } catch {
        return {name: '@oclif/core', version: 'unknown'}
      }
    }
  }
}
