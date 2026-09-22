import {type Command} from '../command'

export type Manifest = {
  commands: Record<string, Command.Cached>
  version: string
}
