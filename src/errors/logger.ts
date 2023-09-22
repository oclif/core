import {appendFile, mkdir} from 'node:fs/promises'
import {dirname} from 'node:path'
import stripAnsi = require('strip-ansi')

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

  constructor(public file: string) {}

  log(msg: string): void {
    msg = stripAnsi(chomp(msg))
    const lines = msg.split('\n').map(l => `${timestamp()} ${l}`.trimEnd())
    this.buffer.push(...lines)
    this.flush(50).catch(console.error)
  }

  async flush(waitForMs = 0): Promise<void> {
    await wait(waitForMs)
    this.flushing = this.flushing.then(async () => {
      if (this.buffer.length === 0) return
      const mylines = this.buffer
      this.buffer = []
      await mkdir(dirname(this.file), {recursive: true})
      await appendFile(this.file, mylines.join('\n') + '\n')
    })
    await this.flushing
  }
}
