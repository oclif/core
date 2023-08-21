
import {rm} from 'shelljs'
import {mkdirp} from 'fs-extra'
import * as cp from 'child_process'
import * as chalk from 'chalk'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {Interfaces} from '../../src'

const debug = require('debug')('e2e')

export type ExecError = cp.ExecException & { stderr: string; stdout: string };

export type Result = {
  code: number;
  stdout?: string;
  stderr?: string;
  error?: ExecError
}

export type SetupOptions = {
  repo: string;
  plugins?: string[];
  subDir?: string;
}

export type ExecutorOptions = {
  pluginDir: string;
  testFileName: string;
}

export type ExecOptions = cp.ExecSyncOptionsWithBufferEncoding & {silent?: boolean}

function updatePkgJson(testDir: string, obj: Record<string, unknown>): Interfaces.PJSON {
  const pkgJsonFile = path.join(testDir, 'package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf-8'))
  obj.dependencies = Object.assign(pkgJson.dependencies || {}, obj.dependencies || {})
  obj.resolutions = Object.assign(pkgJson.resolutions || {}, obj.resolutions || {})
  const updated = Object.assign(pkgJson, obj)
  fs.writeFileSync(pkgJsonFile, JSON.stringify(updated, null, 2))

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
    this.parentDir = path.basename(path.dirname(this.pluginDir))
    this.pluginName = path.basename(this.pluginDir)

    this.debug = debug.extend(`${this.testFileName}:${this.parentDir}:${this.pluginName}`)
  }

  public clone(repo: string): Promise<Result> {
    const result = this.exec(`git clone ${repo} ${this.pluginDir} --depth 1`)
    this.usesJsScript = fs.existsSync(path.join(this.pluginDir, 'bin', 'run.js'))
    return result
  }

  public executeInTestDir(cmd: string, options?: ExecOptions): Promise<Result> {
    return this.exec(cmd, {...options, cwd: this.pluginDir} as ExecOptions)
  }

  public executeCommand(cmd: string, script: 'run' | 'dev' = 'run', options: ExecOptions = {}): Promise<Result> {
    const executable = process.platform === 'win32' ?
      path.join('bin', `${script}.cmd`) :
      path.join('bin', `${script}${this.usesJsScript ? '.js' : ''}`)
    return this.executeInTestDir(`${executable} ${cmd}`, options)
  }

  public exec(cmd: string, options?: ExecOptions): Promise<Result> {
    const cwd = options?.cwd ?? process.cwd()
    const silent = options?.silent ?? true
    return new Promise(resolve => {
      this.debug(cmd, chalk.dim(`(cwd: ${cwd})`))
      if (silent) {
        try {
          const r = cp.execSync(cmd, {
            stdio: 'pipe',
            ...options,
            cwd,
          })
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
        cp.execSync(cmd, {stdio: 'inherit', cwd})
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
  const testFileName = path.basename(testFile)
  const dir = process.env.OCLIF_CORE_E2E_TEST_DIR || os.tmpdir()
  const testDir = options.subDir ? path.join(dir, testFileName, options.subDir) : path.join(dir, testFileName)

  const name = options.repo.slice(options.repo.lastIndexOf('/') + 1)
  const pluginDir = path.join(testDir, name)
  const executor = new Executor({pluginDir, testFileName})

  executor.debug('plugin directory:', pluginDir)

  if (process.env.OCLIF_CORE_E2E_SKIP_SETUP === 'true') {
    console.log(chalk.yellow.bold('OCLIF_CORE_E2E_SKIP_SETUP is true. Skipping test setup...'))
    return executor
  }

  await mkdirp(testDir)
  rm('-rf', pluginDir)

  await executor.clone(options.repo)

  executor.debug('Updating package.json')
  const dependencies = {'@oclif/core': `file:${path.resolve('.')}`}

  let pjson: Interfaces.PJSON
  if (options.plugins) {
    // eslint-disable-next-line unicorn/prefer-object-from-entries
    const pluginDeps = options.plugins.reduce((x, y) => ({...x, [y]: 'latest'}), {})
    pjson = updatePkgJson(pluginDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies: Object.assign(dependencies, pluginDeps),
      oclif: {plugins: options.plugins},
    })
  } else {
    pjson = updatePkgJson(pluginDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies,
    })
  }

  executor.debug('updated dependencies:', JSON.stringify(pjson.dependencies, null, 2))
  executor.debug('updated resolutions:', JSON.stringify(pjson.resolutions, null, 2))
  executor.debug('updated plugins:', JSON.stringify(pjson.oclif.plugins, null, 2))

  const bin = (pjson.oclif.bin ?? pjson.name.replace(/-/g, '_')).toUpperCase()
  const dataDir = path.join(testDir, 'data', pjson.oclif.bin ?? pjson.name)
  const cacheDir = path.join(testDir, 'cache', pjson.oclif.bin ?? pjson.name)
  const configDir = path.join(testDir, 'config', pjson.oclif.bin ?? pjson.name)

  await mkdirp(dataDir)
  await mkdirp(configDir)
  await mkdirp(cacheDir)

  process.env[`${bin}_DATA_DIR`] = dataDir
  process.env[`${bin}_CONFIG_DIR`] = configDir
  process.env[`${bin}_CACHE_DIR`] = cacheDir

  executor.debug(`${bin}_DATA_DIR:`, process.env[`${bin}_DATA_DIR`])
  executor.debug(`${bin}_CONFIG_DIR:`, process.env[`${bin}_CONFIG_DIR`])
  executor.debug(`${bin}_CACHE_DIR:`, process.env[`${bin}_CACHE_DIR`])

  const yarnInstallRes = await executor.executeInTestDir('yarn install --force')
  if (yarnInstallRes.code !== 0) {
    console.error(yarnInstallRes?.error)
    throw new Error('Failed to run `yarn install`')
  }

  const yarnBuildRes = await executor.executeInTestDir('yarn build')
  if (yarnBuildRes.code !== 0) {
    console.error(yarnBuildRes?.error)
    throw new Error('Failed to run `yarn build`')
  }

  return executor
}
