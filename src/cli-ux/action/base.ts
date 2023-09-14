import {inspect} from 'node:util'
import {castArray} from '../../util'
import {stderr, stdout} from '../stream'

export interface ITask {
  action: string;
  status: string | undefined;
  active: boolean;
}

export type ActionType = 'spinner' | 'simple' | 'debug'

export interface Options {
  stdout?: boolean;
}

export class ActionBase {
  type!: ActionType

  std: 'stdout' | 'stderr' = 'stderr'

  protected stdmocks?: ['stdout' | 'stderr', string[]][]

  private stdmockOrigs = {
    stdout: stdout.write,
    stderr: stderr.write,
  }

  public start(action: string, status?: string, opts: Options = {}): void {
    this.std = opts.stdout ? 'stdout' : 'stderr'
    const task = {action, status, active: Boolean(this.task && this.task.active)}
    this.task = task

    this._start()
    task.active = true
    this._stdout(true)
  }

  public stop(msg = 'done'): void {
    const task = this.task
    if (!task) {
      return
    }

    this._stop(msg)
    task.active = false
    this.task = undefined
    this._stdout(false)
  }

  private get globals(): { action: { task?: ITask }; output: string | undefined } {
    (global as any).ux = (global as any).ux || {}
    const globals = (global as any).ux
    globals.action = globals.action || {}
    return globals
  }

  public get task(): ITask | undefined {
    return this.globals.action.task
  }

  public set task(task: ITask | undefined) {
    this.globals.action.task = task
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
    const task = this.task
    if (!task) {
      return
    }

    if (task.status === status) {
      return
    }

    this._updateStatus(status, task.status)
    task.status = status
  }

  public async pauseAsync<T extends any>(fn: () => Promise<T>, icon?: string): Promise<T> {
    const task = this.task
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

  public pause(fn: () => any, icon?: string): Promise<any> {
    const task = this.task
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

  protected _start(): void {
    throw new Error('not implemented')
  }

  protected _stop(_: string): void {
    throw new Error('not implemented')
  }

  protected _resume(): void {
    if (this.task) this.start(this.task.action, this.task.status)
  }

  protected _pause(_?: string): void {
    throw new Error('not implemented')
  }

  protected _updateStatus(_: string | undefined, __?: string): void {}

  // mock out stdout/stderr so it doesn't screw up the rendering
  protected _stdout(toggle: boolean): void {
    try {
      if (toggle) {
        if (this.stdmocks) return
        this.stdmockOrigs = {
          stdout: stdout.write,
          stderr: stderr.write,
        }

        this.stdmocks = []
        stdout.write = (...args: any[]) => {
          this.stdmocks!.push(['stdout', args] as ['stdout', string[]])
          return true
        }

        stderr.write = (...args: any[]) => {
          this.stdmocks!.push(['stderr', args] as ['stderr', string[]])
          return true
        }
      } else {
        if (!this.stdmocks) return
        // this._write('stderr', '\nresetstdmock\n\n\n')
        delete this.stdmocks
        stdout.write = this.stdmockOrigs.stdout
        stderr.write = this.stdmockOrigs.stderr
      }
    } catch (error) {
      this._write('stderr', inspect(error))
    }
  }

  // flush mocked stdout/stderr
  protected _flushStdout(): void {
    try {
      let output = ''
      let std: 'stdout' | 'stderr' | undefined
      while (this.stdmocks && this.stdmocks.length > 0) {
        const cur = this.stdmocks.shift() as ['stdout' | 'stderr', string[]]
        std = cur[0]
        this._write(std, cur[1])
        output += (cur[1][0] as any).toString('utf8')
      }
      // add newline if there isn't one already
      // otherwise we'll just overwrite it when we render

      if (output && std && output[output.length - 1] !== '\n') {
        this._write(std, '\n')
      }
    } catch (error) {
      this._write('stderr', inspect(error))
    }
  }

  // write to the real stdout/stderr
  protected _write(std: 'stdout' | 'stderr', s: string | string[]): void {
    switch (std) {
    case 'stdout':
      this.stdmockOrigs.stdout.apply(stdout, castArray(s) as [string])
      break
    case 'stderr':
      this.stdmockOrigs.stderr.apply(stderr, castArray(s) as [string])
      break
    default:
      throw new Error(`invalid std: ${std}`)
    }
  }
}
