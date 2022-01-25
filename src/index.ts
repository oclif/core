import * as path from 'path'
import * as semver from 'semver'

import Command from './command'
import {run} from './main'
import {Config, Plugin, tsPath, toCached} from './config'
import * as Interfaces from './interfaces'
import * as Errors from './errors'
import * as Flags from './flags'
import {CommandHelp, HelpBase, Help, loadHelpClass} from './help'
import {toStandardizedId, toConfiguredId} from './help/util'
import * as Parser from './parser'
import {Hook} from './interfaces/hooks'
import {settings, Settings} from './settings'
import {HelpSection, HelpSectionRenderer, HelpSectionKeyValueTable} from './help/formatter'
import * as cliUx from './cli-ux'
import {IPromptOptions as _IPromptOptions} from './cli-ux'

const flush = require('../flush')

export {
  Command,
  CommandHelp,
  Config,
  Errors,
  Flags,
  loadHelpClass,
  Help,
  HelpBase,
  HelpSection,
  HelpSectionRenderer,
  HelpSectionKeyValueTable,
  Hook,
  Interfaces,
  Parser,
  Plugin,
  run,
  toCached,
  tsPath,
  toStandardizedId,
  toConfiguredId,
  settings,
  Settings,
  flush,
}

export namespace CliUx {
  export const ux = cliUx.ux
  export const Config = cliUx.Config
  export const config = cliUx.config
  export const ExitError = cliUx.ExitError
  export const ActionBase = cliUx.ActionBase
  export namespace Table {
    export const table = cliUx.Table.table
    // @ts-ignore
    export type Column<T extends Record<string, unknown>> = cliUx.Table.table.Column<T>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export type Columns<T extends Record<string, unknown>> = cliUx.Table.table.Columns<T>
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Options extends cliUx.Table.table.Options {}
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface IPromptOptions extends _IPromptOptions {}
}

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
  const root = path.join(__dirname, '..')
  const pjson = require(path.join(root, 'package.json'))
  if (!semver.satisfies(process.versions.node, pjson.engines.node)) {
    process.stderr.write(`WARNING\nWARNING Node version must be ${pjson.engines.node} to use this CLI\nWARNING Current node version: ${process.versions.node}\nWARNING\n`)
  }
}

checkCWD()
checkNodeVersion()
