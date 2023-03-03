// 3pp
import type {Options} from 'cli-progress'
import {SingleBar} from 'cli-progress'

export default function progress(options: Options = {}): SingleBar {
  // set noTTYOutput for options
  options.noTTYOutput = Boolean(process.env.TERM === 'dumb' || !process.stdin.isTTY)

  return new SingleBar(options)
}
