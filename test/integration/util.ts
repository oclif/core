
import {rm} from 'shelljs'
import {mkdirp} from 'fs-extra'
import * as cp from 'child_process'
import * as chalk from 'chalk'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {Interfaces} from '../../src'

export type ExecError = cp.ExecException & { stderr: string; stdout: string };

export interface Result {
  code: number;
  stdout?: string;
  stderr?: string;
  error?: ExecError
}

export interface Options {
  repo: string;
  plugins?: string[];
}

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
  public isESM = false
  public constructor(public testDir: string, private testFile: string) {}

  public clone(repo: string): Promise<Result> {
    const result = this.exec(`git clone ${repo} ${this.testDir} --depth 1`, process.cwd(), false)
    this.isESM = fs.existsSync(path.join(this.testDir, 'bin', 'run.js'))
    return result
  }

  public executeInTestDir(cmd: string, silent = true): Promise<Result> {
    return this.exec(cmd, this.testDir, silent)
  }

  public executeCommand(cmd: string, script: 'run' | 'dev' = 'run'): Promise<Result> {
    const executable = process.platform === 'win32' ? path.join('bin', `${script}.cmd`) : path.join('bin', `${script}${this.isESM ? '.js' : ''}`)
    return this.executeInTestDir(`${executable} ${cmd}`)
  }

  public exec(cmd: string, cwd = process.cwd(), silent = true): Promise<Result> {
    return new Promise(resolve => {
      if (silent) {
        try {
          const r = cp.execSync(cmd, {
            stdio: 'pipe',
            cwd,
          })
          resolve({code: 0, stdout: r.toString()})
        } catch (error) {
          const err = error as ExecError
          resolve({
            code: 1,
            error: err,
            stdout: err.stdout.toString(),
            stderr: err.stderr.toString(),
          })
        }
      } else {
        this.log(cmd, chalk.dim(`(cwd: ${cwd})`))
        cp.execSync(cmd, {stdio: 'inherit', cwd})
        resolve({code: 0})
      }
    })
  }

  public log(...args: unknown[]): void {
    console.log(chalk.cyan(`${this.testFile}:`), ...args)
  }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Setup for integration tests.
 *
 * Clones the hello-world repo from github
 * Adds the local version of @oclif/core to the package.json
 * Adds relevant oclif plugins
 * Builds the package
 *
 * Environment Variables
 * - OCLIF_CORE_E2E_TEST_DIR: the directory that you want the setup to happen in
 * - OCLIF_CORE_E2E_SKIP_SETUP: skip all the setup steps (useful if iterating on tests)
 */
export async function setup(testFile: string, options: Options): Promise<Executor> {
  const testFileName = path.basename(testFile)
  const dir = process.env.OCLIF_CORE_E2E_TEST_DIR || os.tmpdir()
  const pluginDir = path.join(dir, testFileName)

  const name = options.repo.slice(options.repo.lastIndexOf('/') + 1)
  const testDir = path.join(pluginDir, name)
  const executor = new Executor(testDir, testFileName)

  executor.log('test directory:', testDir)

  if (process.env.OCLIF_CORE_E2E_SKIP_SETUP === 'true') {
    console.log(chalk.yellow.bold('OCLIF_CORE_E2E_SKIP_SETUP is true. Skipping test setup...'))
    return executor
  }

  await mkdirp(pluginDir)
  rm('-rf', testDir)

  await executor.clone(options.repo)

  executor.log('Updating package.json')
  const dependencies = {'@oclif/core': `file:${path.resolve('.')}`}

  let pjson: Interfaces.PJSON
  if (options.plugins) {
    // eslint-disable-next-line unicorn/prefer-object-from-entries
    const pluginDeps = options.plugins.reduce((x, y) => ({...x, [y]: 'latest'}), {})
    pjson = updatePkgJson(testDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies: Object.assign(dependencies, pluginDeps),
      oclif: {plugins: options.plugins},
    })
  } else {
    pjson = updatePkgJson(testDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies,
    })
  }

  executor.log('updated dependencies:', JSON.stringify(pjson.dependencies, null, 2))
  executor.log('updated resolutions:', JSON.stringify(pjson.resolutions, null, 2))
  executor.log('updated plugins:', JSON.stringify(pjson.oclif.plugins, null, 2))

  const bin = (pjson.oclif.bin ?? pjson.name.replace(/-/g, '_')).toUpperCase()
  const dataDir = path.join(dir, 'data', pjson.oclif.bin ?? pjson.name)
  const cacheDir = path.join(dir, 'cache', pjson.oclif.bin ?? pjson.name)
  const configDir = path.join(dir, 'config', pjson.oclif.bin ?? pjson.name)

  await mkdirp(dataDir)
  await mkdirp(configDir)
  await mkdirp(cacheDir)

  process.env[`${bin}_DATA_DIR`] = dataDir
  process.env[`${bin}_CONFIG_DIR`] = configDir
  process.env[`${bin}_CACHE_DIR`] = cacheDir

  executor.log(`${bin}_DATA_DIR:`, process.env[`${bin}_DATA_DIR`])
  executor.log(`${bin}_CONFIG_DIR:`, process.env[`${bin}_CONFIG_DIR`])
  executor.log(`${bin}_CACHE_DIR:`, process.env[`${bin}_CACHE_DIR`])

  const yarnInstallRes = await executor.executeInTestDir('yarn install --force', false)
  if (yarnInstallRes.code !== 0) {
    console.error(yarnInstallRes?.error)
    throw new Error('Failed to run `yarn install`')
  }

  const yarnBuildRes = await executor.executeInTestDir('yarn build', false)
  if (yarnBuildRes.code !== 0) {
    console.error(yarnBuildRes?.error)
    throw new Error('Failed to run `yarn build`')
  }

  return executor
}
