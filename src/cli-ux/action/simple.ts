import {ActionBase, ActionType} from './base'

export default class SimpleAction extends ActionBase {
  public type: ActionType = 'simple'

  protected _start(): void {
    const {task} = this
    if (!task) return
    this._render(task.action, task.status)
  }

  protected _pause(icon?: string): void {
    if (icon) this._updateStatus(icon)
    else this._flush()
  }

  protected _resume(): void {
    // Not implemented
  }

  protected _updateStatus(status: string, prevStatus?: string, newline = false): void {
    const {task, std} = this
    if (!task) return
    if (task.active && !prevStatus) this._write(std, ` ${status}`)
    else this._write(std, `${task.action}... ${status}`)
    if (newline || !prevStatus) this._flush()
  }

  protected _stop(status: string): void {
    const {task} = this
    if (!task) return
    this._updateStatus(status, task.status, true)
  }

  private _render(action: string, status?: string) {
    const {task, std} = this
    if (!task) return
    if (task.active) this._flush()
    this._write(std, status ? `${action}... ${status}` : `${action}...`)
  }

  private _flush() {
    this._write(this.std, '\n')
    this._flushStdout()
  }
}
