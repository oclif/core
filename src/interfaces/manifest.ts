import {Command} from '../command'

export type Manifest = {
  version: string
  commands: {[id: string]: Command.Cached}
}
