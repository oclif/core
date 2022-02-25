import {Command} from './command'
import {Config} from './config'
import {Plugin} from './plugin'

interface HookMeta {
  options: Record<string, unknown>;
  return: any;
}

export interface Hooks {
  [event: string]: HookMeta;
  init: {
    options: { id: string | undefined; argv: string[] };
    return: void;
  };
  prerun: {
    options: { Command: Command.Class; argv: string[] };
    return: void;
  };
  postrun: {
    options: {
      Command: Command.Class;
      result?: any;
      argv: string[];
    };
    return: void;
  };
  preupdate: {
    options: {channel: string, version: string};
    return: void;
  };
  update: {
    options: {channel: string, version: string};
    return: void;
  };
  'command_not_found': {
    options: {id: string; argv?: string[]};
    return: unknown;
  };
  'command_incomplete': {
    options: {id: string; argv: string[], matches: Command.Plugin[]};
    return: unknown;
  };
  'plugins:preinstall': {
    options: {
      plugin: { name: string; tag: string; type: 'npm' } | { url: string; type: 'repo' };
    };
    return: void;
  };
}

export type Hook<T extends keyof P, P extends Hooks = Hooks> = (this: Hook.Context, options: P[T]['options'] & {config: Config}) => Promise<P[T]['return']>

export namespace Hook {
  export type Init = Hook<'init'>
  export type PluginsPreinstall = Hook<'plugins:preinstall'>
  export type Prerun = Hook<'prerun'>
  export type Postrun = Hook<'postrun'>
  export type Preupdate = Hook<'preupdate'>
  export type Update = Hook<'update'>
  export type CommandNotFound = Hook<'command_not_found'>
  export type CommandIncomplete = Hook<'command_incomplete'>

  export interface Context {
    config: Config;
    exit(code?: number): void;
    error(message: string | Error, options?: {code?: string; exit?: number}): void;
    warn(message: string): void;
    log(message?: any, ...args: any[]): void;
    debug(...args: any[]): void;
  }

  export interface Result<T> {
    successes: Array<{ result: T; plugin: Plugin }>;
    failures: Array<{ error: Error; plugin: Plugin }>;
  }
}

