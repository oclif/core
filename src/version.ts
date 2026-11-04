import {tsPath} from './config/ts-path'
import * as Interfaces from './interfaces'
import {ClassLocationOptions} from './interfaces/pjson'
import {load} from './module-loader'
import {ux} from './ux'

export abstract class VersionBase {
  constructor(protected config: Interfaces.Config) {}

  /**
   * Show the CLI version information.
   */
  public abstract showVersion(): Promise<void>
}

export class Version extends VersionBase {
  public async showVersion(): Promise<void> {
    ux.stdout(this.config.userAgent)
  }
}

interface VersionBaseDerived {
  new (config: Interfaces.Config): VersionBase
}

function extractClass(exported: any): VersionBaseDerived {
  return exported && exported.default ? exported.default : exported
}

function determineLocation(versionClass: string | ClassLocationOptions): ClassLocationOptions {
  if (typeof versionClass === 'string') return {identifier: 'default', target: versionClass}
  if (!versionClass.identifier) return {...versionClass, identifier: 'default'}
  return versionClass
}

export async function loadVersionClass(config: Interfaces.Config): Promise<VersionBaseDerived> {
  if (config.pjson.oclif?.versionClass) {
    const {identifier, target} = determineLocation(config.pjson.oclif?.versionClass)
    try {
      const path = (await tsPath(config.root, target)) ?? target
      const module = await load(config, path)
      const versionClass = module[identifier] ?? (identifier === 'default' ? extractClass(module) : undefined)
      return extractClass(versionClass)
    } catch (error: any) {
      throw new Error(`Unable to load configured version class "${target}", failed with message:\n${error.message}`)
    }
  }

  return Version
}
