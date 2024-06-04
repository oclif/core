import {stderr, stdout} from 'supports-color'

export function supportsColor(): boolean {
  return Boolean(stdout) && Boolean(stderr)
}
