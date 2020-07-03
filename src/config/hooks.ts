import * as Config from '.'

export interface Hooks {
  [event: string]: object;
  init: {
    id: string | undefined;
    argv: string[];
  };
  prerun: {
    Command: Config.Command.Class;
    argv: string[];
  };
  postrun: {
    Command: Config.Command.Class;
    result?: any;
    argv: string[];
  };
  preupdate: {channel: string};
  update: {channel: string};
  'command_not_found': {id: string};
  'plugins:preinstall': {
    plugin: {
      name: string;
      tag: string;
      type: 'npm';
    } | {
      url: string;
      type: 'repo';
    };
  };
}

export type HookKeyOrOptions<K> = K extends (keyof Hooks) ? Hooks[K] : K
export type Hook<T> = (this: Hook.Context, options: HookKeyOrOptions<T> & {config: Config.IConfig}) => any

export namespace Hook {
  export type Init = Hook<Hooks['init']>
  export type PluginsPreinstall = Hook<Hooks['plugins:preinstall']>
  export type Prerun = Hook<Hooks['prerun']>
  export type Postrun = Hook<Hooks['postrun']>
  export type Preupdate = Hook<Hooks['preupdate']>
  export type Update = Hook<Hooks['update']>
  export type CommandNotFound = Hook<Hooks['command_not_found']>

  export interface Context {
    config: Config.IConfig;
    exit(code?: number): void;
    error(message: string | Error, options?: {code?: string; exit?: number}): void;
    warn(message: string): void;
    log(message?: any, ...args: any[]): void;
    debug(...args: any[]): void;
  }
}
