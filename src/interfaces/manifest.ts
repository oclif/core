import {Cached} from '../command'

export type Manifest = {
  version: string;
  commands: {[id: string]: Cached};
}
