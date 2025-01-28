import ansis from 'ansis'
import {ExecException, execSync, ExecSyncOptionsWithBufferEncoding} from 'node:child_process'
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {mkdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {basename, dirname, join, resolve} from 'node:path'

import {Interfaces} from '../../src'

const debug = require('debug')('integration')

export type ExecError = ExecException & {stderr: string; stdout: string}

export type Result = {
  code: number
  stdout?: string
  stderr?: string
  error?: ExecError
}

export type SetupOptions = {
  repo: string
  branch?: string
  plugins?: string[]
  subDir?: string
  noLinkCore?: boolean
  useTsx?: boolean | undefined
}

export type ExecutorOptions = {
  pluginDir: string
  testFileName: string
}

export type ExecOptions = ExecSyncOptionsWithBufferEncoding & {silent?: boolean}

export type Script = 'run' | 'dev' | 'bun dev' | 'tsx dev'

function updatePkgJson(testDir: string, obj: Record<string, unknown>): Interfaces.PJSON {
  const pkgJsonFile = join(testDir, 'package.json')
  const pkgJson = JSON.parse(readFileSync(pkgJsonFile, 'utf8'))
  obj.dependencies = Object.assign(pkgJson.dependencies || {}, obj.dependencies || {})
  obj.resolutions = Object.assign(pkgJson.resolutions || {}, obj.resolutions || {})
  obj.devDependencies = Object.assign(pkgJson.devDependencies || {}, obj.devDependencies || {})
  const updated = Object.assign(pkgJson, obj)
  writeFileSync(pkgJsonFile, JSON.stringify(updated, null, 2))

  return updated
}

export class Executor {
  public debug: (...args: any[]) => void
  public parentDir: string
  public pluginDir: string
  public pluginName: string
  public testFileName: string

  public usesJsScript = false

  public constructor(options: ExecutorOptions) {
    this.pluginDir = options.pluginDir
    this.testFileName = options.testFileName
    this.parentDir = basename(dirname(this.pluginDir))
    this.pluginName = basename(this.pluginDir)
    this.usesJsScript = existsSync(join(this.pluginDir, 'bin', 'run.js'))
    this.debug = debug.extend(`${this.testFileName}:${this.parentDir}:${this.pluginName}`)
  }

  public clone(repo: string, branch?: string): Promise<Result> {
    const cmd = branch
      ? `git clone --branch ${branch} ${repo} ${this.pluginDir} --depth 1`
      : `git clone ${repo} ${this.pluginDir} --depth 1`
    const result = this.exec(cmd)
    this.usesJsScript = existsSync(join(this.pluginDir, 'bin', 'run.js'))
    return result
  }

  public exec(cmd: string, options?: ExecOptions): Promise<Result> {
    const cwd = options?.cwd ?? process.cwd()
    const silent = options?.silent ?? true
    return new Promise((resolve) => {
      this.debug(cmd, ansis.dim(`(cwd: ${cwd})`))
      if (silent) {
        try {
          const r = execSync(cmd, {...options, stdio: 'pipe', cwd})
          const stdout = r.toString()
          this.debug(stdout)
          resolve({code: 0, stdout})
        } catch (error) {
          const err = error as ExecError
          this.debug('stdout', err.stdout.toString())
          this.debug('stderr', err.stderr.toString())
          resolve({
            code: 1,
            error: err,
            stdout: err.stdout.toString(),
            stderr: err.stderr.toString(),
          })
        }
      } else {
        execSync(cmd, {...options, stdio: 'inherit', cwd})
        resolve({code: 0})
      }
    })
  }

  public executeCommand(cmd: string, script: Script = 'run', options: ExecOptions = {}): Promise<Result> {
    if (script.includes(' ')) {
      const [runtime, theScript] = script.split(' ')
      const executable =
        process.platform === 'win32'
          ? join('bin', `${theScript}.cmd`)
          : join('bin', `${theScript}${this.usesJsScript ? '.js' : ''}`)
      return this.executeInTestDir(`${runtime} ${executable} ${cmd}`, options)
    }

    const executable =
      process.platform === 'win32'
        ? join('bin', `${script}.cmd`)
        : join('bin', `${script}${this.usesJsScript ? '.js' : ''}`)
    return this.executeInTestDir(`${executable} ${cmd}`, options)
  }

  public executeInTestDir(cmd: string, options?: ExecOptions): Promise<Result> {
    return this.exec(cmd, {...options, cwd: this.pluginDir} as ExecOptions)
  }
}

/**
 * Setup for integration tests.
 *
 * Clones the requested repo from github
 * Adds the local version of @oclif/core to the package.json
 * Adds relevant oclif plugins
 * Builds the package
 *
 * Environment Variables
 * - OCLIF_CORE_INTEGRATION_TEST_DIR: the directory that you want the setup to happen in
 * - OCLIF_CORE_INTEGRATION_SKIP_SETUP: skip all the setup steps (useful if iterating on tests)
 */
export async function setup(testFile: string, options: SetupOptions): Promise<Executor> {
  const testFileName = basename(testFile)
  const dir = process.env.OCLIF_CORE_INTEGRATION_TEST_DIR || tmpdir()
  const testDir = options.subDir ? join(dir, testFileName, options.subDir) : join(dir, testFileName)

  const name = options.repo.slice(options.repo.lastIndexOf('/') + 1)
  const pluginDir = join(testDir, name)
  const executor = new Executor({pluginDir, testFileName})

  executor.debug('plugin directory:', pluginDir)

  if (process.env.OCLIF_CORE_INTEGRATION_SKIP_SETUP === 'true') {
    console.log(ansis.yellow.bold('OCLIF_CORE_INTEGRATION_SKIP_SETUP is true. Skipping test setup...'))
    return executor
  }

  await mkdir(testDir, {recursive: true})
  await rm(pluginDir, {recursive: true, force: true})

  await executor.clone(options.repo, options.branch)

  executor.debug('Updating package.json')
  const dependencies = options.noLinkCore ? {} : {'@oclif/core': `file:${resolve('.')}`}
  const devDependencies = options.useTsx ? {tsx: 'latest'} : {}

  let pjson: Interfaces.PJSON
  if (options.plugins) {
    const pluginDeps = options.plugins.reduce((x, y) => ({...x, [y]: 'latest'}), {})
    pjson = updatePkgJson(pluginDir, {
      ...(options.noLinkCore ? {} : {resolutions: {'@oclif/core': resolve('.')}}),
      dependencies: {...dependencies, ...pluginDeps},
      devDependencies,
      oclif: {plugins: options.plugins},
    })
  } else {
    pjson = updatePkgJson(pluginDir, {
      ...(options.noLinkCore ? {} : {resolutions: {'@oclif/core': resolve('.')}}),
      devDependencies,
      dependencies,
    })
  }

  executor.debug('updated dependencies:', JSON.stringify(pjson.dependencies, null, 2))
  executor.debug('updated devDependencies:', JSON.stringify(pjson.devDependencies, null, 2))
  executor.debug('updated resolutions:', JSON.stringify(pjson.resolutions, null, 2))
  executor.debug('updated plugins:', JSON.stringify(pjson.oclif.plugins, null, 2))

  const bin = (pjson.oclif.bin ?? pjson.name.replaceAll('-', '_')).toUpperCase()
  const dataDir = join(testDir, 'data', pjson.oclif.bin ?? pjson.name)
  const cacheDir = join(testDir, 'cache', pjson.oclif.bin ?? pjson.name)
  const configDir = join(testDir, 'config', pjson.oclif.bin ?? pjson.name)

  await mkdir(dataDir, {recursive: true})
  await mkdir(configDir, {recursive: true})
  await mkdir(cacheDir, {recursive: true})

  process.env[`${bin}_DATA_DIR`] = dataDir
  process.env[`${bin}_CONFIG_DIR`] = configDir
  process.env[`${bin}_CACHE_DIR`] = cacheDir

  executor.debug(`${bin}_DATA_DIR:`, process.env[`${bin}_DATA_DIR`])
  executor.debug(`${bin}_CONFIG_DIR:`, process.env[`${bin}_CONFIG_DIR`])
  executor.debug(`${bin}_CACHE_DIR:`, process.env[`${bin}_CACHE_DIR`])

  const yarnInstallRes = await executor.executeInTestDir(
    'yarn install --force --network-timeout 600000 --ignore-scripts',
    {
      silent: false,
    },
  )
  if (yarnInstallRes.code !== 0) {
    console.error(yarnInstallRes?.error)
    throw new Error('Failed to run `yarn install --force`')
  }

  const compileRes = await executor.executeInTestDir('yarn build')
  if (compileRes.code !== 0) {
    console.error(compileRes?.error)
    throw new Error('Failed to run `yarn build`')
  }

  executor.debug('Setup complete')
  return executor
}
