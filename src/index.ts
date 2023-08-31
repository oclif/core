import {Command} from './command'
import run from './main'
import execute from './execute'
import handle from './errors/handle'
import {Config, Plugin, tsPath, toCached} from './config'
import * as Interfaces from './interfaces'
import * as Errors from './errors'
import * as Flags from './flags'
import * as Args from './args'
import {CommandHelp, HelpBase, Help, loadHelpClass} from './help'
import {toStandardizedId, toConfiguredId} from './help/util'
import * as Parser from './parser'
import {Hook} from './interfaces/hooks'
import settings, {Settings} from './settings'
import {HelpSection, HelpSectionRenderer, HelpSectionKeyValueTable} from './help/formatter'
import * as ux from './ux'
import {stderr, stdout} from './ux/stream'
import Performance from './performance'
import flush from './ux/flush'

export {
  Args,
  Command,
  CommandHelp,
  Config,
  Errors,
  execute,
  Flags,
  flush,
  handle,
  Help,
  HelpBase,
  HelpSection,
  HelpSectionKeyValueTable,
  HelpSectionRenderer,
  Hook,
  Interfaces,
  loadHelpClass,
  Parser,
  Performance,
  Plugin,
  run,
  settings,
  Settings,
  stderr,
  stdout,
  toCached,
  toConfiguredId,
  toStandardizedId,
  tsPath,
  ux,
}

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
