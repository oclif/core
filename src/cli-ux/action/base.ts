import {inspect} from 'node:util'

import {castArray} from '../../util/util'
import {Options} from './types'

export interface ITask {
  action: string
  active: boolean
  status: string | undefined
}

export type ActionType = 'debug' | 'simple' | 'spinner'

export class ActionBase {
  std: 'process.stderr' | 'process.stdout' = 'process.stderr'

  protected stdmocks?: ['process.stderr' | 'process.stdout', string[]][]

  type!: ActionType

  private stdmockOrigs = {
    stderr: process.stderr.write,
    stdout: process.stdout.write,
  }

  protected get output(): string | undefined {
    return this.globals.output
  }

  protected set output(output: string | undefined) {
    this.globals.output = output
  }

  get running(): boolean {
    return Boolean(this.task)
  }

  get status(): string | undefined {
    return this.task ? this.task.status : undefined
  }

  set status(status: string | undefined) {
    const {task} = this
    if (!task) {
      return
    }

    if (task.status === status) {
      return
    }

    this._updateStatus(status, task.status)
    task.status = status
  }

  public get task(): ITask | undefined {
    return this.globals.action.task
  }

  public set task(task: ITask | undefined) {
    this.globals.action.task = task
  }

  public pause(fn: () => any, icon?: string): Promise<any> {
    const {task} = this
    const active = task && task.active
    if (task && active) {
      this._pause(icon)
      this._stdout(false)
      task.active = false
    }

    const ret = fn()
    if (task && active) {
      this._resume()
    }

    return ret
  }

  public async pauseAsync<T>(fn: () => Promise<T>, icon?: string): Promise<T> {
    const {task} = this
    const active = task && task.active
    if (task && active) {
      this._pause(icon)
      this._stdout(false)
      task.active = false
    }

    const ret = await fn()
    if (task && active) {
      this._resume()
    }

    return ret
  }

  public start(action: string, status?: string, opts: Options = {}): void {
    this.std = opts.stdout ? 'process.stdout' : 'process.stderr'
    const task = {action, active: Boolean(this.task && this.task.active), status}
    this.task = task

    this._start(opts)
    task.active = true
    this._stdout(true)
  }

  public stop(msg = 'done'): void {
    const {task} = this
    if (!task) {
      return
    }

    this._stop(msg)
    task.active = false
    this.task = undefined
    this._stdout(false)
  }

  // flush mocked stdout/stderr
  protected _flushStdout(): void {
    try {
      let output = ''
      let std: 'process.stderr' | 'process.stdout' | undefined
      while (this.stdmocks && this.stdmocks.length > 0) {
        const cur = this.stdmocks.shift() as ['process.stderr' | 'process.stdout', string[]]
        std = cur[0]
        this._write(std, cur[1])
        output += (cur[1][0] as any).toString('utf8')
      }
      // add newline if there isn't one already
      // otherwise we'll just overwrite it when we render

      if (output && std && output.at(-1) !== '\n') {
        this._write(std, '\n')
      }
    } catch (error) {
      this._write('process.stderr', inspect(error))
    }
  }

  protected _pause(_?: string): void {
    throw new Error('not implemented')
  }

  protected _resume(): void {
    if (this.task) this.start(this.task.action, this.task.status)
  }

  protected _start(_opts: Options): void {
    throw new Error('not implemented')
  }

  // mock out stdout/stderr so it doesn't screw up the rendering
  protected _stdout(toggle: boolean): void {
    try {
      if (toggle) {
        if (this.stdmocks) return
        this.stdmockOrigs = {
          stderr: process.stderr.write,
          stdout: process.stdout.write,
        }

        this.stdmocks = []
        process.stdout.write = (...args: any[]) => {
          this.stdmocks!.push(['process.stdout', args] as ['process.stdout', string[]])
          return true
        }

        process.stderr.write = (...args: any[]) => {
          this.stdmocks!.push(['process.stderr', args] as ['process.stderr', string[]])
          return true
        }
      } else {
        if (!this.stdmocks) return
        // this._write('process.stderr', '\nresetstdmock\n\n\n')
        delete this.stdmocks
        process.stdout.write = this.stdmockOrigs.stdout
        process.stderr.write = this.stdmockOrigs.stderr
      }
    } catch (error) {
      this._write('process.stderr', inspect(error))
    }
  }

  protected _stop(_: string): void {
    throw new Error('not implemented')
  }

  protected _updateStatus(_: string | undefined, __?: string): void {
    // Not implemented
  }

  // write to the real process.stdout/process.stderr
  protected _write(std: 'process.stderr' | 'process.stdout', s: string | string[]): void {
    switch (std) {
      case 'process.stdout': {
        this.stdmockOrigs.stdout.apply(process.stdout, castArray(s) as [string])
        break
      }

      case 'process.stderr': {
        this.stdmockOrigs.stderr.apply(process.stderr, castArray(s) as [string])
        break
      }

      default: {
        throw new Error(`invalid std: ${std}`)
      }
    }
  }

  private get globals(): {action: {task?: ITask}; output: string | undefined} {
    ;(global as any).ux = (global as any).ux || {}
    const globals = (global as any).ux
    globals.action = globals.action || {}
    return globals
  }
}
