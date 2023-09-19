import * as Args from './args'
import * as Errors from './errors'
import * as Flags from './flags'
import * as Interfaces from './interfaces'
import * as Parser from './parser'
import * as ux from './cli-ux'
import {CommandHelp, Help, HelpBase, loadHelpClass} from './help'
import {Config, Plugin, toCached, tsPath} from './config'
import {HelpSection, HelpSectionKeyValueTable, HelpSectionRenderer} from './help/formatter'
import {Settings, settings} from './settings'
import {stderr, stdout} from './cli-ux/stream'
import {toConfiguredId, toStandardizedId} from './help/util'

import {Command} from './command'
import {Hook} from './interfaces/hooks'
import Performance from './performance'
import execute from './execute'
import {flush} from './cli-ux/flush'
import {handle} from './errors/handle'
import run from './main'

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
