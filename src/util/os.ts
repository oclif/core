import {homedir, platform} from 'node:os'

/**
 * Call os.homedir() and return the result
 *
 * Wrapping this allows us to stub these in tests since os.homedir() is
 * non-configurable and non-writable.
 *
 * @returns The user's home directory
 */
export function getHomeDir(): string {
  return homedir()
}

/**
 * Call os.platform() and return the result
 *
 * Wrapping this allows us to stub these in tests since os.platform() is
 * non-configurable and non-writable.
 *
 * @returns The process' platform
 */
export function getPlatform(): NodeJS.Platform {
  return platform()
}
