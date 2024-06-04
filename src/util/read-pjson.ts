import {cosmiconfig} from 'cosmiconfig'
import {join} from 'node:path'

import {PJSON} from '../interfaces'
import {makeDebug} from '../logger'
import {readJson} from './fs'

const debug = makeDebug('read-pjson')

/**
 * Read the package.json file from a given path and add the oclif config (found by cosmiconfig) if it exists.
 *
 * We can assume that the package.json file exists because the plugin root has already been loaded at this point.
 */
export async function readPjson(path: string): Promise<PJSON> {
  const pjsonPath = join(path, 'package.json')
  if (process.env.OCLIF_DISABLE_RC) {
    debug('OCLIF_DISABLE_RC is set, skipping rc search')
    return readJson<PJSON>(pjsonPath)
  }

  const pjson = await readJson<PJSON>(pjsonPath)

  // don't bother with cosmiconfig if the plugin's package.json already has an oclif config
  if (pjson.oclif) {
    debug(`found oclif config in ${pjsonPath}`)
    return pjson
  }

  debug(`searching for oclif config in ${path}`)
  const explorer = cosmiconfig('oclif', {
    /**
     * Remove the following from the defaults:
     * - package.json
     * - any files under .config/
     */
    searchPlaces: [
      '.oclifrc',
      '.oclifrc.json',
      '.oclifrc.yaml',
      '.oclifrc.yml',
      '.oclifrc.js',
      '.oclifrc.ts',
      '.oclifrc.mjs',
      '.oclifrc.cjs',
      'oclif.config.js',
      'oclif.config.ts',
      'oclif.config.mjs',
      'oclif.config.cjs',
    ],
    searchStrategy: 'none',
  })
  const result = await explorer.search(path)
  if (!result?.config) {
    debug(`no oclif config found in ${path}`)
    return pjson
  }

  debug(`found oclif config for ${path}: %O`, result)
  return {
    ...pjson,
    oclif: result?.config ?? {},
  }
}
