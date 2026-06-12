import WSL from 'is-wsl'
import {execSync} from 'node:child_process'
import {homedir, userInfo as osUserInfo, platform} from 'node:os'
import path from 'node:path'

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
export function getPlatform(): 'wsl' | NodeJS.Platform {
  return WSL ? 'wsl' : platform()
}

export function getShell(): string {
  let shellPath
  const SHELL = process.env.SHELL ?? osUserInfo().shell?.split(path.sep)?.pop()
  if (SHELL) {
    shellPath = SHELL.split('/')
  } else if (getPlatform() === 'win32') {
    shellPath = determineWindowsShell().split(path.sep)
  } else {
    shellPath = ['unknown']
  }

  return shellPath.at(-1) ?? 'unknown'
}

function determineWindowsShell(): string {
  try {
    const parentProcessName = execSync(
      `powershell.exe -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessID = ${process.ppid}').Name"`,
      {encoding: 'utf8'},
    )
    return parentProcessName.includes('powershell') || parentProcessName.includes('pwsh')
      ? 'powershell'
      : (process.env.COMSPEC ?? 'cmd.exe')
  } catch {
    return process.env.COMSPEC ?? 'cmd.exe'
  }
}
