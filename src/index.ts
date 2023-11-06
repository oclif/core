import write from './cli-ux/write'

// learn about the no-color manifest in this link: https://no-color.org/
// learn about how to disable chalks colors in this link: https://github.com/chalk/chalk#supportscolor
process.env.FORCE_COLOR = (Number(!process.env.NO_COLOR) * 3).toString()

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
export * as ux from './cli-ux'
export {flush} from './cli-ux/flush'
// Remove these in the next major version
export {stderr, stdout} from './cli-ux/stream'
export {Command} from './command'
export {Config, Plugin} from './config'
export * as Errors from './errors'
export {handle} from './errors/handle'
export {execute} from './execute'
export * as Flags from './flags'
export {CommandHelp, Help, HelpBase, loadHelpClass} from './help'
export {HelpSection, HelpSectionKeyValueTable, HelpSectionRenderer} from './help/formatter'
export {toConfiguredId, toStandardizedId} from './help/util'
export * as Interfaces from './interfaces'
export {Hook} from './interfaces/hooks'
export {run} from './main'
export * as ModuleLoader from './module-loader'
export * as Parser from './parser'
export {Performance} from './performance'
export {Settings, settings} from './settings'
