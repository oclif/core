// Use * as for import to ensure the types are portable
import type * as spinners from 'cli-spinners'

export type Options = {
  stdout?: boolean
  style?: spinners.SpinnerName | 'random'
}
