import * as path from 'path'
import * as semver from 'semver'

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

import Command from './command'
import * as flags from './flags'
export {run, Main} from './main'

export default Command
export {
  Command,
  flags,
}
