import ansis from 'ansis'
import makeDebug from 'debug'
import {dirname} from 'node:path'

import {LoadOptions} from '../src/interfaces'
import {run} from '../src/main'

const debug = makeDebug('test')

const OPTIONS = {
  print: false,
  stripAnsi: true,
}

const originals = {
  stderr: process.stderr.write,
  stdout: process.stdout.write,
}

const output: Record<'stderr' | 'stdout', Array<string | Uint8Array>> = {
  stderr: [],
  stdout: [],
}

function mockedStdout(str: Uint8Array | string, cb?: (err?: Error) => void): boolean
function mockedStdout(str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean
function mockedStdout(
  str: Uint8Array | string,
  encoding?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
): boolean {
  output.stdout.push(str)
  if (!OPTIONS.print) return true

  if (typeof encoding === 'string') {
    return originals.stdout.bind(process.stdout)(str, encoding, cb)
  }

  return originals.stdout.bind(process.stdout)(str, cb)
}

function mockedStderr(str: Uint8Array | string, cb?: (err?: Error) => void): boolean
function mockedStderr(str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean
function mockedStderr(
  str: Uint8Array | string,
  encoding?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
): boolean {
  output.stderr.push(str)
  if (!OPTIONS.print) return true
  if (typeof encoding === 'string') {
    return originals.stdout.bind(process.stderr)(str, encoding, cb)
  }

  return originals.stdout.bind(process.stderr)(str, cb)
}

const restore = (): void => {
  process.stderr.write = originals.stderr
  process.stdout.write = originals.stdout
}

const reset = (): void => {
  output.stderr = []
  output.stdout = []
}

const toString = (str: string | Uint8Array): string =>
  OPTIONS.stripAnsi ? ansis.strip(str.toString()) : str.toString()

const getStderr = (): string => output.stderr.map((b) => toString(b)).join('')
const getStdout = (): string => output.stdout.map((b) => toString(b)).join('')

const record = (opts?: {print?: boolean; stripAnsi?: boolean}): void => {
  OPTIONS.print = opts?.print ?? false
  OPTIONS.stripAnsi = opts?.stripAnsi ?? true
  process.stderr.write = mockedStderr
  process.stdout.write = mockedStdout
}

function traverseFilePathUntil(filename: string, predicate: (filename: string) => boolean): string {
  let current = filename
  while (!predicate(current)) {
    current = dirname(current)
  }

  return current
}

export async function runCommand<T>(
  args: string[],
  loadOpts?: LoadOptions,
  recordOpts?: {print?: boolean; stripAnsi?: boolean},
): Promise<{
  stdout: string
  stderr: string
  // code: number,
  result: T
}> {
  const loadOptions = loadOpts ?? {
    root: traverseFilePathUntil(
      require.main?.path ?? module.path,
      (p) => !(p.includes('node_modules') || p.includes('.pnpm') || p.includes('.yarn')),
    ),
  }

  debug('loadOpts: %O', loadOpts)

  record(recordOpts ?? {print: false, stripAnsi: true})
  const result = await run(args, loadOptions)
  const stdout = getStdout()
  const stderr = getStderr()
  restore()
  reset()
  return {
    result: result as T,
    stderr,
    stdout,
  }
}
