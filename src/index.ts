function checkCWD() {
  try {
    process.cwd()
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      process.stderr.write('WARNING: current directory does not exist\n')
    }
  }
}

checkCWD()

export * as Args from './args'
export {Command} from './command'
export {Config, Plugin} from './config'
export * as Errors from './errors'
export {handle} from './errors/handle'
export {execute} from './execute'
export * as Flags from './flags'
export {flush} from './flush'
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
export {methods as ux} from './ux'
