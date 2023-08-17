
import {rm} from 'shelljs'
import {mkdir} from 'node:fs/promises'
import * as cp from 'child_process'
import * as chalk from 'chalk'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export type ExecError = cp.ExecException & { stderr: string; stdout: string };

export interface Result {
  code: number;
  output?: string;
  error?: ExecError
}

export interface Options {
  repo: string;
  plugins?: string[];
}

function updatePkgJson(testDir: string, obj: Record<string, unknown>): void {
  const pkgJsonFile = path.join(testDir, 'package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf-8'))
  obj.dependencies = Object.assign(pkgJson.dependencies || {}, obj.dependencies || {})
  obj.resolutions = Object.assign(pkgJson.resolutions || {}, obj.resolutions || {})
  const updated = Object.assign(pkgJson, obj)
  fs.writeFileSync(pkgJsonFile, JSON.stringify(updated, null, 2))
}

export class Executor {
  public constructor(private testDir: string) {}

  public executeInTestDir(cmd: string, silent = true): Promise<Result> {
    return this.exec(cmd, this.testDir, silent)
  }

  public executeCommand(cmd: string): Promise<Result> {
    const executable = process.platform === 'win32' ? path.join('bin', 'run.cmd') : path.join('bin', 'run')
    return this.executeInTestDir(`${executable} ${cmd}`)
  }

  public exec(cmd: string, cwd = process.cwd(), silent = true): Promise<Result> {
    return new Promise(resolve => {
      if (silent) {
        try {
          const r = cp.execSync(cmd, {stdio: 'pipe', cwd})
          resolve({code: 0, output: r.toString()})
        } catch (error) {
          const err = error as ExecError
          resolve({code: 1, error: err, output: err.stdout.toString()})
        }
      } else {
        console.log(chalk.cyan(cmd))
        cp.execSync(cmd, {stdio: 'inherit', cwd})
        resolve({code: 0})
      }
    })
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
  const location = path.join(process.env.OCLIF_CORE_E2E_TEST_DIR || os.tmpdir(), testFileName)
  const [name] = options.repo.match(/(?<=\/).+?(?=\.)/) ?? ['hello-world']
  const testDir = path.join(location, name)
  const executor = new Executor(testDir)

  console.log(chalk.cyan(`${testFileName}:`), testDir)

  if (process.env.OCLIF_CORE_E2E_SKIP_SETUP === 'true') {
    console.log(chalk.yellow.bold('OCLIF_CORE_E2E_SKIP_SETUP is true. Skipping test setup...'))
    return executor
  }

  await mkdir(location, {recursive: true})
  rm('-rf', testDir)

  const clone = `git clone ${options.repo} ${testDir}`
  console.log(chalk.cyan(`${testFileName}:`), clone)
  await executor.exec(clone)

  console.log(chalk.cyan(`${testFileName}:`), 'Updating package.json')
  const dependencies = {'@oclif/core': `file:${path.resolve('.')}`}

  if (options.plugins) {
    // eslint-disable-next-line unicorn/prefer-object-from-entries
    const pluginDeps = options.plugins.reduce((x, y) => ({...x, [y]: 'latest'}), {})
    updatePkgJson(testDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies: Object.assign(dependencies, pluginDeps),
      oclif: {plugins: options.plugins},
    })
  } else {
    updatePkgJson(testDir, {
      resolutions: {'@oclif/core': path.resolve('.')},
      dependencies,
    })
  }

  const install = 'yarn install --force'
  console.log(chalk.cyan(`${testFileName}:`), install)
  const yarnInstallRes = await executor.executeInTestDir(install, false)
  if (yarnInstallRes.code !== 0) {
    console.error(yarnInstallRes?.error)
    throw new Error('Failed to run `yarn install`')
  }

  const build = 'yarn build'
  console.log(chalk.cyan(`${testFileName}:`), build)
  const yarnBuildRes = await executor.executeInTestDir(build, false)
  if (yarnBuildRes.code !== 0) {
    console.error(yarnBuildRes?.error)
    throw new Error('Failed to run `yarn build`')
  }

  return executor
}
