// import {Command} from './command'
import {Cached} from '../command'

export interface Manifest {
  version: string;
  commands: {[id: string]: Cached};
}
