import * as FS from 'fs-extra'
import * as path from 'path'
import StripAnsi = require('strip-ansi')

const timestamp = () => new Date().toISOString()
let timer: any
const wait = (ms: number) => new Promise(resolve => {
  if (timer) timer.unref()
  timer = setTimeout(() => resolve(null), ms)
})

function chomp(s: string): string {
  if (s.endsWith('\n')) return s.replace(/\n$/, '')
  return s
}

export class Logger {
  protected flushing: Promise<void> = Promise.resolve()

  protected buffer: string[] = []

  // eslint-disable-next-line no-useless-constructor
  constructor(public file: string) {}

  log(msg: string) {
    const stripAnsi: typeof StripAnsi = require('strip-ansi')
    msg = stripAnsi(chomp(msg))
    const lines = msg.split('\n').map(l => `${timestamp()} ${l}`.trimEnd())
    this.buffer.push(...lines)
    // tslint:disable-next-line no-console
    this.flush(50).catch(console.error)
  }

  async flush(waitForMs = 0) {
    await wait(waitForMs)
    this.flushing = this.flushing.then(async () => {
      if (this.buffer.length === 0) return
      const mylines = this.buffer
      this.buffer = []
      const fs: typeof FS = require('fs-extra')
      await fs.mkdirp(path.dirname(this.file))
      await fs.appendFile(this.file, mylines.join('\n') + '\n')
    })
    await this.flushing
  }
}
