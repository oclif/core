import {stderr} from './cli-ux/stream'

function checkCWD() {
  try {
    process.cwd()
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      stderr.write('WARNING: current directory does not exist\n')
    }
  }
}

checkCWD()

export * as Args from './args'
export * as Errors from './errors'
export * as Interfaces from './interfaces'
export * as Flags from './flags'
export * as Parser from './parser'
export * as ux from './cli-ux'
export {CommandHelp, HelpBase, Help, loadHelpClass} from './help'
export {Config, toCached, Plugin, tsPath} from './config'
export {HelpSection, HelpSectionRenderer, HelpSectionKeyValueTable} from './help/formatter'
export {Settings, settings} from './settings'
export {stdout, stderr} from './cli-ux/stream'
export {toConfiguredId, toStandardizedId} from './help/util'
export {Command} from './command'
export {Hook} from './interfaces/hooks'
export {Performance} from './performance'
export {execute} from './execute'
export {flush} from './cli-ux/flush'
export {handle} from './errors/handle'
export {run} from './main'
