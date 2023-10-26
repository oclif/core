import {Command} from '../command'
import {Config} from './config'
import {Plugin} from './plugin'

interface HookMeta {
  options: Record<string, unknown>
  return: any
}

type Context = {
  debug(...args: any[]): void
  error(message: Error | string, options?: {code?: string; exit?: number}): void
  exit(code?: number): void
  log(message?: any, ...args: any[]): void
  warn(message: string): void
}

export interface Hooks {
  [event: string]: HookMeta
  command_incomplete: {
    options: {argv: string[]; id: string; matches: Command.Loadable[]}
    return: unknown
  }
  command_not_found: {
    options: {argv?: string[]; id: string}
    return: unknown
  }
  init: {
    options: {argv: string[]; id: string | undefined}
    return: void
  }
  jit_plugin_not_installed: {
    options: {argv: string[]; command: Command.Loadable; id: string; pluginName: string; pluginVersion: string}
    return: unknown
  }
  'plugins:preinstall': {
    options: {
      plugin: {name: string; tag: string; type: 'npm'} | {type: 'repo'; url: string}
    }
    return: void
  }
  postrun: {
    options: {
      Command: Command.Class
      argv: string[]
      result?: any
    }
    return: void
  }
  prerun: {
    options: {Command: Command.Class; argv: string[]}
    return: void
  }
  preupdate: {
    options: {channel: string; version: string}
    return: void
  }
  update: {
    options: {channel: string; version: string}
    return: void
  }
}

export type Hook<T extends keyof P, P extends Hooks = Hooks> = (
  this: Hook.Context,
  options: P[T]['options'] & {config: Config; context: Context},
) => Promise<P[T]['return']>

export namespace Hook {
  export type Init = Hook<'init'>
  export type PluginsPreinstall = Hook<'plugins:preinstall'>
  export type Prerun = Hook<'prerun'>
  export type Postrun = Hook<'postrun'>
  export type Preupdate = Hook<'preupdate'>
  export type Update = Hook<'update'>
  export type CommandNotFound = Hook<'command_not_found'>
  export type CommandIncomplete = Hook<'command_incomplete'>
  export type JitPluginNotInstalled = Hook<'jit_plugin_not_installed'>

  export interface Context {
    config: Config
    debug(...args: any[]): void
    error(message: Error | string, options?: {code?: string; exit?: number}): void
    exit(code?: number): void
    log(message?: any, ...args: any[]): void
    warn(message: string): void
  }

  export interface Result<T> {
    failures: Array<{error: Error; plugin: Plugin}>
    successes: Array<{plugin: Plugin; result: T}>
  }
}
