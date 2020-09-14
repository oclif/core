import * as path from 'path'
import * as semver from 'semver'

import Command from './command'
import {run} from './main'
import * as Config from './config'
import * as Errors from './errors'
import * as flags from './flags'
import * as Help from './help'
import * as Parser from './parser'

export {
  Command,
  Config,
  Errors,
  flags,
  Help,
  Parser,
  run,
}

function checkCWD() {
  try {
    process.cwd()
  } catch (error) {
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
