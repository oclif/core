import ansis from 'ansis'
import makeDebug from 'debug'
import {dirname} from 'node:path'

import {Config} from '../src'
import {CLIError} from '../src/errors'
import {LoadOptions} from '../src/interfaces'
import {run} from '../src/main'

const debug = makeDebug('test')

type CaptureOptions = {
  print?: boolean
  stripAnsi?: boolean
}

const RECORD_OPTIONS: CaptureOptions = {
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
  if (!RECORD_OPTIONS.print) return true

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
  if (!RECORD_OPTIONS.print) return true
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
  RECORD_OPTIONS.stripAnsi ? ansis.strip(str.toString()) : str.toString()

const getStderr = (): string => output.stderr.map((b) => toString(b)).join('')
const getStdout = (): string => output.stdout.map((b) => toString(b)).join('')

function traverseFilePathUntil(filename: string, predicate: (filename: string) => boolean): string {
  let current = filename
  while (!predicate(current)) {
    current = dirname(current)
  }

  return current
}

function makeLoadOptions(loadOpts?: LoadOptions): LoadOptions {
  return (
    loadOpts ?? {
      root: traverseFilePathUntil(
        require.main?.path ?? module.path,
        (p) => !(p.includes('node_modules') || p.includes('.pnpm') || p.includes('.yarn')),
      ),
    }
  )
}

export async function captureOutput<T>(
  fn: () => Promise<unknown>,
  opts?: CaptureOptions,
): Promise<{
  stdout: string
  stderr: string
  result?: T
  error?: Error & Partial<CLIError>
}> {
  RECORD_OPTIONS.print = opts?.print ?? false
  RECORD_OPTIONS.stripAnsi = opts?.stripAnsi ?? true
  process.stderr.write = mockedStderr
  process.stdout.write = mockedStdout

  try {
    const result = await fn()
    return {
      result: result as T,
      stderr: getStderr(),
      stdout: getStdout(),
    }
  } catch (error) {
    return {
      ...(error instanceof CLIError && {error}),
      ...(error instanceof Error && {error}),
      stderr: getStderr(),
      stdout: getStdout(),
    }
  } finally {
    restore()
    reset()
  }
}

export async function runCommand<T>(
  args: string[],
  loadOpts?: LoadOptions,
  captureOpts?: CaptureOptions,
): Promise<{
  stdout: string
  stderr: string
  // code: number,
  result?: T
  error?: Error & Partial<CLIError>
}> {
  const loadOptions = makeLoadOptions(loadOpts)
  debug('loadOpts: %O', loadOpts)
  return captureOutput<T>(async () => run(args, loadOptions), captureOpts)
}

export async function runHook<T>(
  hook: string,
  options: Record<string, unknown>,
  loadOpts?: LoadOptions,
  recordOpts?: CaptureOptions,
): Promise<{
  stdout: string
  stderr: string
  // code: number,
  result?: T
  error?: Error & Partial<CLIError>
}> {
  const loadOptions = makeLoadOptions(loadOpts)

  debug('loadOpts: %O', loadOpts)

  return captureOutput<T>(async () => {
    const config = await Config.load(loadOptions)
    return config.runHook(hook, options)
  }, recordOpts)
}
