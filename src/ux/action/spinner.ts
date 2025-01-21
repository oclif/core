const ansiEscapes = require('ansi-escapes')
import ansis from 'ansis'
import spinners from 'cli-spinners'

import Cache from '../../cache'
import {errtermwidth} from '../../screen'
import {colorize} from '../theme'
import {ActionBase, ActionType} from './base'
import {Options} from './types'

export default class SpinnerAction extends ActionBase {
  public type: ActionType = 'spinner'
  private color = 'magenta'
  private frameIndex: number
  private frames: string[]
  private spinner?: NodeJS.Timeout

  constructor() {
    super()
    this.frames = this.getFrames()
    this.frameIndex = 0
  }

  protected _frame(): string {
    const frame = this.frames[this.frameIndex]
    this.frameIndex = ++this.frameIndex % this.frames.length
    return this.colorize(frame)
  }

  protected _pause(icon?: string): void {
    if (this.spinner) clearInterval(this.spinner)
    this._reset()
    if (icon) this._render(` ${icon}`)
    this.output = undefined
  }

  protected _start(opts: Options): void {
    this.color = (Cache.getInstance().get('config')?.theme?.spinner as string | undefined) ?? this.color
    if (opts.style) this.frames = this.getFrames(opts)

    this._reset()
    if (this.spinner) clearInterval(this.spinner)
    this._render()
    this.spinner = setInterval(
      (icon) => this._render.bind(this)(icon),
      process.platform === 'win32' ? 500 : 100,
      'spinner',
    )
    const interval = this.spinner
    interval.unref()
  }

  protected _stop(status: string): void {
    if (this.task) this.task.status = status
    if (this.spinner) clearInterval(this.spinner)
    this._render()
    this.output = undefined
  }

  protected colorize(s: string): string {
    return colorize(this.color, s)
  }

  private _lines(s: string): number {
    return (ansis.strip(s).split('\n') as any[])
      .map((l) => Math.ceil(l.length / errtermwidth))
      .reduce((c, i) => c + i, 0)
  }

  private _render(icon?: string) {
    if (!this.task) return
    this._reset()
    this._flushStdout()
    const frame = icon === 'spinner' ? ` ${this._frame()}` : icon || ''
    const status = this.task.status ? ` ${this.task.status}` : ''
    this.output = `${this.task.action}...${frame}${status}\n`

    this._write(this.std, this.output)
  }

  private _reset() {
    if (!this.output) return
    const lines = this._lines(this.output)
    this._write(this.std, ansiEscapes.cursorLeft + ansiEscapes.cursorUp(lines) + ansiEscapes.eraseDown)
    this.output = undefined
  }

  private getFrames(opts?: Options) {
    if (opts?.style) return spinners[opts.style].frames

    return spinners[process.platform === 'win32' ? 'line' : 'dots2'].frames
  }
}
