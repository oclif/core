import {execSync} from 'node:child_process'
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

export function getParentProcessName(): string | undefined {
  if (platform() !== 'win32') {
    // TODO: Currently there is no need for non-Windows implementation, but if we end up needing one, this is where it would go.
    return undefined
  }

  try {
    // This will print a CSV row describing the process with that ID; something like this:
    // '"pwsh.exe","21052",.......
    const out = execSync(`tasklist /FI "PID eq ${process.ppid}" /FO CSV /NH`, {
      encoding: 'utf8',
    })
    const regexMatch: RegExpMatchArray | null = out.match(/^"([^"]+)"/)
    return regexMatch ? regexMatch[1].toLowerCase() : undefined
  } catch {
    return undefined
  }
}
