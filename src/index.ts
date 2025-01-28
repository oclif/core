import {isTruthy} from './util/util'
function checkCWD() {
  try {
    process.cwd()
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      process.stderr.write('WARNING: current directory does not exist\n')
    }
  }
}

function checkNodeVersion() {
  if (process.env.OCLIF_DISABLE_ENGINE_WARNING && isTruthy(process.env.OCLIF_DISABLE_ENGINE_WARNING)) return
  try {
    const path = require('node:path')
    const semver = require('semver')
    const root = path.join(__dirname, '..')
    const pjson = require(path.join(root, 'package.json'))
    if (!semver.satisfies(process.versions.node, pjson.engines.node)) {
      process.emitWarning(
        `Node version must be ${pjson.engines.node} to use this CLI. Current node version: ${process.versions.node}`,
      )
    }
  } catch {
    // ignore
  }
}

checkCWD()
checkNodeVersion()

export * as Args from './args'
export {Command} from './command'
export {Config, Plugin} from './config'
export * as Errors from './errors'
export {handle} from './errors/handle'
export {execute} from './execute'
export * as Flags from './flags'
export {flush} from './flush'
export {
  CommandHelp,
  Help,
  HelpBase,
  type HelpSection,
  type HelpSectionKeyValueTable,
  type HelpSectionRenderer,
  loadHelpClass,
} from './help'
export * as Interfaces from './interfaces'
export {type Hook} from './interfaces/hooks'
export {getLogger} from './logger'
export {run} from './main'
export * as ModuleLoader from './module-loader'
export * as Parser from './parser'
export {Performance} from './performance'
export {type Settings, settings} from './settings'
export {toConfiguredId, toStandardizedId} from './util/ids'
export {ux} from './ux'
