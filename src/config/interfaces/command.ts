import * as Parser from '../../parser'

import {Config, LoadOptions} from './config'
import {Plugin} from './plugin'

export interface Command {
  id: string;
  hidden: boolean;
  aliases: string[];
  description?: string;
  usage?: string | string[];
  examples?: string[];
  type?: string;
  pluginName?: string;
  pluginType?: string;
  flags: {[name: string]: Command.Flag};
  args: Command.Arg[];
}

export namespace Command {
  export interface Arg {
    name: string;
    description?: string;
    required?: boolean;
    hidden?: boolean;
    default?: string;
    options?: string[];
  }

  export type Flag = Flag.Boolean | Flag.Option

  export namespace Flag {
    export interface Boolean {
      type: 'boolean';
      name: string;
      required?: boolean;
      char?: string;
      hidden?: boolean;
      description?: string;
      helpLabel?: string;
      allowNo?: boolean;
    }
    export interface Option {
      type: 'option';
      name: string;
      required?: boolean;
      char?: string;
      hidden?: boolean;
      description?: string;
      helpLabel?: string;
      helpValue?: string;
      default?: string;
      options?: string[];
    }
  }

  export interface Base {
    _base: string;
    id: string;
    hidden: boolean;
    aliases: string[];
    description?: string;
    usage?: string | string[];
    examples?: string[];
  }

  export interface Class extends Base {
    plugin?: Plugin;
    flags?: Parser.flags.Input<any>;
    args?: Parser.args.Input;
    new(argv: string[], config: Config): Instance;
    run(argv?: string[], config?: LoadOptions): PromiseLike<any>;
  }

  export interface Instance {
    _run(argv: string[]): Promise<any>;
  }

  export interface Plugin extends Command {
    load(): Class;
  }
}
