import * as path from 'path'
import * as semver from 'semver'

import Command from './command'
import {run} from './main'
import {Config, Plugin, tsPath, toCached} from './config'
import * as Interfaces from './interfaces'
import * as Errors from './errors'
import * as Flags from './flags'
import {HelpBase, Help, loadHelpClass} from './help'
import {toStandardizedId, toConfiguredId} from './help/util'
import * as Parser from './parser'
import {Hook} from './interfaces/hooks'
import {settings, Settings} from './settings'
import {EOL} from 'os'

const flush = require('../flush')

export {
  Command,
  Config,
  Errors,
  Flags,
  loadHelpClass,
  Help,
  HelpBase,
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

function checkCWD() {
  try {
    process.cwd()
  } catch (error) {
    if (error.code === 'ENOENT') {
      process.stderr.write('WARNING: current directory does not exist' + EOL)
    }
  }
}
function checkNodeVersion() {
  const root = path.join(__dirname, '..')
  const pjson = require(path.join(root, 'package.json'))
  if (!semver.satisfies(process.versions.node, pjson.engines.node)) {
    process.stderr.write(`WARNING${EOL}WARNING Node version must be ${pjson.engines.node} to use this CLI${EOL}WARNING Current node version: ${process.versions.node}${EOL}WARNING${EOL}`)
  }
}
checkCWD()
checkNodeVersion()
