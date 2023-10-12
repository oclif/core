// 3pp
import {Options, SingleBar} from 'cli-progress'

export default function progress(options: Options = {}): SingleBar {
  return new SingleBar({noTTYOutput: Boolean(process.env.TERM === 'dumb' || !process.stdin.isTTY), ...options})
}
