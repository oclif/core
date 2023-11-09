import {PJSON, Plugin} from '../interfaces'

type CacheContents = {
  rootPlugin: Plugin
  rootCli: PJSON.CLI
}

type ValueOf<T> = T[keyof T]

/**
 * A simple cache for storing values that need to be accessed globally.
 */
export default class Cache extends Map<keyof CacheContents, ValueOf<CacheContents>> {
  static instance: Cache
  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }

    return Cache.instance
  }

  public get(key: 'rootPlugin'): Plugin | undefined
  public get(key: 'rootCli'): PJSON.CLI | undefined
  public get(key: keyof CacheContents): ValueOf<CacheContents> | undefined {
    return super.get(key)
  }
}
