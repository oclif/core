// 3pp
import * as cliProgress from 'cli-progress'

export default function progress(options?: any): any {
  // if no options passed, create empty options
  if (!options) {
    options = {}
  }

  // set noTTYOutput for options
  options.noTTYOutput = Boolean(process.env.TERM === 'dumb' || !process.stdin.isTTY)

  return new cliProgress.SingleBar(options)
}
