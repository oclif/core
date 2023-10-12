import {ActionBase, ActionType} from './base'

export default class SimpleAction extends ActionBase {
  public type: ActionType = 'simple'

  private _flush() {
    this._write(this.std, '\n')
    this._flushStdout()
  }

  protected _pause(icon?: string): void {
    if (icon) this._updateStatus(icon)
    else this._flush()
  }

  private _render(action: string, status?: string) {
    if (!this.task) return
    if (this.task.active) this._flush()
    this._write(this.std, status ? `${action}... ${status}` : `${action}...`)
  }

  protected _resume(): void {
    // Not implemented
  }

  protected _start(): void {
    if (!this.task) return
    this._render(this.task.action, this.task.status)
  }

  protected _stop(status: string): void {
    if (!this.task) return
    this._updateStatus(status, this.task.status, true)
  }

  protected _updateStatus(status: string, prevStatus?: string, newline = false): void {
    if (!this.task) return
    if (this.task.active && !prevStatus) this._write(this.std, ` ${status}`)
    else this._write(this.std, `${this.task.action}... ${status}`)
    if (newline || !prevStatus) this._flush()
  }
}
