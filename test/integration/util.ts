
import {mkdir, rm} from 'node:fs/promises'
import {ExecException, ExecSyncOptionsWithBufferEncoding, execSync} from 'node:child_process'
import * as chalk from 'chalk'
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {basename, dirname, join, resolve} from 'node:path'
import {Interfaces} from '../../src'

const debug = require('debug')('e2e')

export type ExecError = ExecException & { stderr: string; stdout: string };

export type Result = {
  code: number;
  stdout?: string;
  stderr?: string;
  error?: ExecError
}

export type SetupOptions = {
  repo: string;
  branch?: string;
  plugins?: string[];
  subDir?: string;
}

export type ExecutorOptions = {
  pluginDir: string;
  testFileName: string;
}

export type ExecOptions = ExecSyncOptionsWithBufferEncoding & {silent?: boolean}

function updatePkgJson(testDir: string, obj: Record<string, unknown>): Interfaces.PJSON {
  const pkgJsonFile = join(testDir, 'package.json')
  const pkgJson = JSON.parse(readFileSync(pkgJsonFile, 'utf8'))
  obj.dependencies = Object.assign(pkgJson.dependencies || {}, obj.dependencies || {})
  obj.resolutions = Object.assign(pkgJson.resolutions || {}, obj.resolutions || {})
  const updated = Object.assign(pkgJson, obj)
  writeFileSync(pkgJsonFile, JSON.stringify(updated, null, 2))

  return updated
}

export class Executor {
  public usesJsScript = false
  public pluginDir: string
  public testFileName: string
  public parentDir: string
  public pluginName: string

  public constructor(options: ExecutorOptions) {
    this.pluginDir = options.pluginDir
    this.testFileName = options.testFileName
    this.parentDir = basename(dirname(this.pluginDir))
    this.pluginName = basename(this.pluginDir)

    this.debug = debug.extend(`${this.testFileName}:${this.parentDir}:${this.pluginName}`)
  }

  public clone(repo: string, branch?: string): Promise<Result> {
    const cmd = branch ? `git clone --branch ${branch} ${repo} ${this.pluginDir} --depth 1` : `git clone ${repo} ${this.pluginDir} --depth 1`
    const result = this.exec(cmd)
    this.usesJsScript = existsSync(join(this.pluginDir, 'bin', 'run.js'))
    return result
  }

  public executeInTestDir(cmd: string, options?: ExecOptions): Promise<Result> {
    return this.exec(cmd, {...options, cwd: this.pluginDir} as ExecOptions)
  }

  public executeCommand(cmd: string, script: 'run' | 'dev' = 'run', options: ExecOptions = {}): Promise<Result> {
    const executable = process.platform === 'win32'
      ? join('bin', `${script}.cmd`)
      : join('bin', `${script}${this.usesJsScript ? '.js' : ''}`)
    return this.executeInTestDir(`${executable} ${cmd}`, options)
  }

  public exec(cmd: string, options?: ExecOptions): Promise<Result> {
    const cwd = options?.cwd ?? process.cwd()
    const silent = options?.silent ?? true
    return new Promise(resolve => {
      this.debug(cmd, chalk.dim(`(cwd: ${cwd})`))
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

  public debug: (...args: any[]) => void
}

// eslint-disable-next-line valid-jsdoc
/**
 * Setup for integration tests.
 *
 * Clones the requested repo from github
 * Adds the local version of @oclif/core to the package.json
 * Adds relevant oclif plugins
 * Builds the package
 *
 * Environment Variables
 * - OCLIF_CORE_E2E_TEST_DIR: the directory that you want the setup to happen in
 * - OCLIF_CORE_E2E_SKIP_SETUP: skip all the setup steps (useful if iterating on tests)
 */
export async function setup(testFile: string, options: SetupOptions): Promise<Executor> {
  const testFileName = basename(testFile)
  const dir = process.env.OCLIF_CORE_E2E_TEST_DIR || tmpdir()
  const testDir = options.subDir ? join(dir, testFileName, options.subDir) : join(dir, testFileName)

  const name = options.repo.slice(options.repo.lastIndexOf('/') + 1)
  const pluginDir = join(testDir, name)
  const executor = new Executor({pluginDir, testFileName})

  executor.debug('plugin directory:', pluginDir)

  if (process.env.OCLIF_CORE_E2E_SKIP_SETUP === 'true') {
    console.log(chalk.yellow.bold('OCLIF_CORE_E2E_SKIP_SETUP is true. Skipping test setup...'))
    return executor
  }

  await mkdir(testDir, {recursive: true})
  await rm(pluginDir, {recursive: true, force: true})

  await executor.clone(options.repo, options.branch)

  executor.debug('Updating package.json')
  const dependencies = {'@oclif/core': `file:${resolve('.')}`}

  let pjson: Interfaces.PJSON
  if (options.plugins) {
    // eslint-disable-next-line unicorn/prefer-object-from-entries
    const pluginDeps = options.plugins.reduce((x, y) => ({...x, [y]: 'latest'}), {})
    pjson = updatePkgJson(pluginDir, {
      resolutions: {'@oclif/core': resolve('.')},
      dependencies: Object.assign(dependencies, pluginDeps),
      oclif: {plugins: options.plugins},
    })
  } else {
    pjson = updatePkgJson(pluginDir, {
      resolutions: {'@oclif/core': resolve('.')},
      dependencies,
    })
  }

  executor.debug('updated dependencies:', JSON.stringify(pjson.dependencies, null, 2))
  executor.debug('updated resolutions:', JSON.stringify(pjson.resolutions, null, 2))
  executor.debug('updated plugins:', JSON.stringify(pjson.oclif.plugins, null, 2))

  const bin = (pjson.oclif.bin ?? pjson.name.replace(/-/g, '_')).toUpperCase()
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

  const yarnInstallRes = await executor.executeInTestDir('yarn install --force --network-timeout 600000', {silent: false})
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
