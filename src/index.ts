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
export {Settings, settings} from './settings'
export {toConfiguredId, toStandardizedId} from './util/ids'
export {default as ux} from './ux'
