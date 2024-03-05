import * as cliUx from './cli-ux'
import write from './cli-ux/write'

function checkCWD() {
  try {
    process.cwd()
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      write.stderr('WARNING: current directory does not exist\n')
    }
  }
}

checkCWD()

export * as Args from './args'
/**
 * @deprecated `ux` will be removed in the next major. See https://github.com/oclif/core/discussions/999
 */
export const ux = {
  ...cliUx,
}
export {flush} from './cli-ux/flush'
export {stderr, stdout} from './cli-ux/stream' // Remove these in the next major version
export {Command} from './command'
export {Config, Plugin} from './config'
export * as Errors from './errors'
export {handle} from './errors/handle'
export {execute} from './execute'
export * as Flags from './flags'
export {CommandHelp, Help, HelpBase, loadHelpClass} from './help'
export {HelpSection, HelpSectionKeyValueTable, HelpSectionRenderer} from './help/formatter'
export * as Interfaces from './interfaces'
export {Hook} from './interfaces/hooks'
export {run} from './main'
export * as ModuleLoader from './module-loader'
export * as Parser from './parser'
export {Performance} from './performance'
export {Settings, settings} from './settings'
export {toConfiguredId, toStandardizedId} from './util/ids'
