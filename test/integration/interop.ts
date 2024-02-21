/**
 * These integration tests do not use mocha because we encountered an issue with
 * spawning child processes for testing root ESM plugins with linked ESM plugins.
 * This scenario works as expected when running outside of mocha.
 *
 * Instead of spending more time diagnosing the root cause, we are just going to
 * run these integration tests using ts-node and a lightweight homemade test runner.
 */
import {expect} from 'chai'
import chalk from 'chalk'
import fs from 'node:fs/promises'
import path from 'node:path'

import {Command, Flags, flush, handle} from '../../src'
import {Executor, Script, setup} from './util'

const TESTS = ['cjs', 'esm', 'precore', 'coreV1', 'coreV2'] as const
const DEV_RUN_TIMES = ['default', 'bun', 'tsx'] as const

type Plugin = {
  name: string
  command: string
  package: string
  repo: string
}

type InstallPluginOptions = {
  executor: Executor
  plugin: Plugin
  script: Script
}

type LinkPluginOptions = {
  executor: Executor
  plugin: Plugin
  script: Script
  noLinkCore?: boolean
}

type RunCommandOptions = {
  executor: Executor
  plugin: Plugin
  script: Script
  expectStrings?: string[]
  expectJson?: Record<string, any>
  env?: Record<string, string>
  args?: Array<string | boolean>
}

type ModifyCommandOptions = {
  executor: Executor
  plugin: Plugin
  from: string
  to: string
}

type CleanUpOptions = {
  executor: Executor
  script: Script
  plugin: Plugin
}

type PluginConfig = {
  name: string
  command: string
  package: string
  repo: string
  commandText: string
  hookText: string
  expectJson: {
    whenProvided: {
      args: Record<string, string | boolean>
      flags: Record<string, string | boolean>
    }
    whenNotProvided: {
      args: Record<string, string | null | boolean>
      flags: Record<string, string | null | boolean>
    }
  }
}

async function testRunner({
  tests,
  devRunTime,
}: {
  tests: Array<(typeof TESTS)[number]>
  devRunTime: (typeof DEV_RUN_TIMES)[number]
}): Promise<{failed: string[]; passed: string[]}> {
  const failed: string[] = []
  const passed: string[] = []

  const commonProps = {
    expectJson: {
      whenProvided: {
        args: {
          optionalArg: 'arg1',
          defaultArg: 'arg2',
          defaultFnArg: 'arg3',
        },
        flags: {
          optionalString: 'flag1',
          defaultString: 'flag2',
          defaultFnString: 'flag3',
          json: true,
        },
      },
      whenNotProvided: {
        args: {
          defaultArg: 'simple string default',
          defaultFnArg: 'async fn default',
        },
        flags: {
          defaultString: 'simple string default',
          defaultFnString: 'async fn default',
          json: true,
        },
      },
    },
  }

  const PLUGINS: Record<string, PluginConfig> = {
    esm1: {
      name: 'plugin-test-esm-1',
      command: 'esm1',
      package: '@oclif/plugin-test-esm-1',
      repo: 'https://github.com/oclif/plugin-test-esm-1',
      commandText: 'hello I am an ESM plugin',
      hookText: 'Greetings! from plugin-test-esm-1 init hook',
      ...commonProps,
    },
    esm2: {
      name: 'plugin-test-esm-2',
      command: 'esm2',
      package: '@oclif/plugin-test-esm-2',
      repo: 'https://github.com/oclif/plugin-test-esm-2',
      commandText: 'hello I am an ESM plugin',
      hookText: 'Greetings! from plugin-test-esm-2 init hook',
      ...commonProps,
    },
    cjs1: {
      name: 'plugin-test-cjs-1',
      command: 'cjs1',
      package: '@oclif/plugin-test-cjs-1',
      repo: 'https://github.com/oclif/plugin-test-cjs-1',
      commandText: 'hello I am a CJS plugin',
      hookText: 'Greetings! from plugin-test-cjs-1 init hook',
      ...commonProps,
    },
    cjs2: {
      name: 'plugin-test-cjs-2',
      command: 'cjs2',
      package: '@oclif/plugin-test-cjs-2',
      repo: 'https://github.com/oclif/plugin-test-cjs-2',
      commandText: 'hello I am a CJS plugin',
      hookText: 'Greetings! from plugin-test-cjs-2 init hook',
      ...commonProps,
    },
    precore: {
      name: 'plugin-test-pre-core',
      command: 'pre-core',
      package: '@oclif/plugin-test-pre-core',
      repo: 'https://github.com/oclif/plugin-test-pre-core',
      commandText: 'hello I am a pre-core plugin',
      hookText: 'Greetings! from plugin-test-pre-core init hook',
      expectJson: {
        whenProvided: commonProps.expectJson.whenProvided,
        whenNotProvided: {
          args: {
            defaultArg: 'simple string default',
            defaultFnArg: 'fn default',
          },
          flags: {
            defaultString: 'simple string default',
            defaultFnString: 'fn default',
            json: true,
          },
        },
      },
    },
    coreV1: {
      name: 'plugin-test-core-v1',
      command: 'core-v1',
      package: '@oclif/plugin-test-core-v1',
      repo: 'https://github.com/oclif/plugin-test-core-v1',
      commandText: 'hello I am an @oclif/core@v1 plugin',
      hookText: 'Greetings! from plugin-test-core-v1 init hook',
      ...commonProps,
    },
    coreV2: {
      name: 'plugin-test-core-v2',
      command: 'core-v2',
      package: '@oclif/plugin-test-core-v2',
      repo: 'https://github.com/oclif/plugin-test-core-v2',
      commandText: 'hello I am an @oclif/core@v2 plugin',
      hookText: 'Greetings! from plugin-test-core-v2 init hook',
      ...commonProps,
    },
  }

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn()
      passed.push(name)
      console.log(chalk.green('✓'), name)
    } catch (error) {
      failed.push(name)
      console.log(chalk.red('𐄂'), name)
      console.log(error)
    }
  }

  async function installPlugin(options: InstallPluginOptions): Promise<void> {
    const result = await options.executor.executeCommand(`plugins:install ${options.plugin.package}`, options.script)
    expect(result.code).to.equal(0)

    const pluginsResult = await options.executor.executeCommand('plugins', options.script)
    expect(pluginsResult.stdout).to.include(options.plugin.name)
  }

  async function linkPlugin(options: LinkPluginOptions): Promise<Executor> {
    const pluginExecutor = await setup(__filename, {
      repo: options.plugin.repo,
      subDir: options.executor.parentDir,
      noLinkCore: options.noLinkCore ?? false,
    })

    const result = await options.executor.executeCommand(
      `plugins:link ${pluginExecutor.pluginDir} --no-install`,
      options.script,
    )
    expect(result.code).to.equal(0)

    const pluginsResult = await options.executor.executeCommand('plugins', options.script)
    expect(pluginsResult.stdout).to.include(options.plugin.name)

    return pluginExecutor
  }

  async function modifyCommand(options: ModifyCommandOptions): Promise<void> {
    const filePath = path.join(options.executor.pluginDir, 'src', 'commands', `${options.plugin.command}.ts`)
    const content = await fs.readFile(filePath, 'utf8')
    const modifiedContent = content.replace(options.from, options.to)
    await fs.writeFile(filePath, modifiedContent)
  }

  async function runCommand(options: RunCommandOptions): Promise<void> {
    const env = {...process.env, ...options.env}
    const result = await options.executor.executeCommand(
      `${options.plugin.command} ${options.args?.join(' ') ?? ''}`,
      options.script,
      {env},
    )
    expect(result.code).to.equal(0)

    if (options.expectStrings) {
      for (const expectString of options.expectStrings) {
        expect(result.stdout).to.include(expectString)
      }
    }

    if (options.expectJson && options.args?.includes('--json')) {
      // clear any non-json output from hooks
      const split = result.stdout?.split('\n') ?? []
      const idx = split.findIndex((i) => i.startsWith('{'))
      const json = JSON.parse(split.slice(idx).join('\n'))
      expect(json).to.deep.equal(options.expectJson)
    }
  }

  async function cleanUp(options: CleanUpOptions): Promise<void> {
    await options.executor.executeCommand(`plugins:uninstall ${options.plugin.package}`)
    const {stdout} = await options.executor.executeCommand('plugins')
    expect(stdout).to.not.include(options.plugin.package)
  }

  const devExecutable = (devRunTime === 'default' ? 'dev' : `${devRunTime} dev`) as 'dev' | 'bun dev' | 'tsx dev'

  let cjsExecutor: Executor
  let esmExecutor: Executor

  const cjsBefore = async () => {
    cjsExecutor = await setup(__filename, {repo: PLUGINS.cjs1.repo, subDir: 'cjs'})
  }

  const esmBefore = async () => {
    esmExecutor = await setup(__filename, {repo: PLUGINS.esm1.repo, subDir: 'esm'})
  }

  const precoreBefore = async () => {
    if (!cjsExecutor) await cjsBefore()
    if (!esmExecutor) await esmBefore()
  }

  const coreV1Before = async () => {
    if (!cjsExecutor) await cjsBefore()
    if (!esmExecutor) await esmBefore()
  }

  const coreV2Before = async () => {
    if (!cjsExecutor) await cjsBefore()
    if (!esmExecutor) await esmBefore()
  }

  const installTest = async (plugin: PluginConfig, executor: Executor) => {
    await installPlugin({executor, plugin, script: 'run'})

    // test that the root plugin's bin/run can execute the installed plugin
    await runCommand({
      executor,
      plugin,
      script: 'run',
      expectStrings: [plugin.commandText],
    })

    // test that the root plugin's bin/run can execute the installed plugin
    // and that args and flags work as expected when no values are provided
    await runCommand({
      executor,
      plugin,
      script: 'run',
      args: ['--json'],
      expectJson: plugin.expectJson.whenNotProvided,
    })

    // test that the root plugin's bin/run can execute the installed plugin
    // and that args and flags work as expected when values are provided
    await runCommand({
      executor,
      plugin,
      script: 'run',
      args: [
        ...Object.values(plugin.expectJson.whenProvided.args),
        ...Object.entries(plugin.expectJson.whenProvided.flags).map(([flag, value]) => {
          if (flag === 'json') return '--json'
          return `--${flag} ${value}`
        }),
      ],
      expectJson: plugin.expectJson.whenProvided,
    })

    // test that the root plugin's bin/dev can execute the installed plugin
    await runCommand({
      executor,
      plugin,
      script: devExecutable,
      expectStrings: [plugin.commandText],
    })

    await cleanUp({executor, plugin, script: 'run'})
  }

  const linkTest = async (plugin: PluginConfig, executor: Executor, noLinkCore = false) => {
    const linkedPlugin = await linkPlugin({executor, plugin, script: 'run', noLinkCore})

    // test bin/run
    await runCommand({
      executor,
      plugin,
      script: 'run',
      expectStrings: [plugin.commandText, plugin.hookText],
    })
    // test un-compiled changes with bin/run
    await modifyCommand({executor: linkedPlugin, plugin, from: 'hello', to: 'howdy'})
    await runCommand({
      executor,
      plugin,
      script: 'run',
      expectStrings: ['howdy', plugin.hookText],
    })

    // test un-compiled changes with bin/dev
    await modifyCommand({executor: linkedPlugin, plugin, from: 'howdy', to: 'cheers'})
    await runCommand({
      executor,
      plugin,
      script: devExecutable,
      expectStrings: ['cheers', plugin.hookText],
    })

    await cleanUp({executor, plugin, script: 'run'})
  }

  const cjsTests = async () => {
    await test('Install CJS plugin to CJS root plugin', async () => {
      await installTest(PLUGINS.cjs2, cjsExecutor)
    })

    await test('Install ESM plugin to CJS root plugin', async () => {
      await installTest(PLUGINS.esm1, cjsExecutor)
    })

    await test('Link CJS plugin to CJS root plugin', async () => {
      await linkTest(PLUGINS.cjs2, cjsExecutor)
    })

    await test('Link ESM plugin to CJS root plugin', async () => {
      // We don't use linkTest here because that would test that the
      // ESM plugin is auto-transpiled which we're not supporting at the moment.
      const plugin = PLUGINS.esm2

      await linkPlugin({executor: cjsExecutor, plugin, script: 'run'})

      // test bin/run
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })

      // test bin/dev
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: devExecutable,
        expectStrings: [plugin.commandText, plugin.hookText],
      })

      await cleanUp({executor: cjsExecutor, plugin, script: 'run'})
    })
  }

  const esmTests = async () => {
    await test('Install CJS plugin to ESM root plugin', async () => {
      await installTest(PLUGINS.cjs1, esmExecutor)
    })

    await test('Install ESM plugin to ESM root plugin', async () => {
      await installTest(PLUGINS.esm2, esmExecutor)
    })

    await test('Link CJS plugin to ESM root plugin', async () => {
      await linkTest(PLUGINS.cjs1, esmExecutor)
    })

    await test('Link ESM plugin to ESM root plugin', async () => {
      const plugin = PLUGINS.esm2

      await linkPlugin({executor: esmExecutor, plugin, script: 'run'})
      // test bin/run
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })

      // Skipping these because we decided to not support auto-transpiling ESM plugins at this time.
      // // test un-compiled changes with bin/run
      // await modifyCommand({executor: linkedPlugin, plugin, from: 'hello', to: 'howdy'})
      // await runCommand({
      //   executor: esmExecutor,
      //   plugin,
      //   script: 'run',
      //   expectStrings: ['howdy', plugin.hookText],
      //   env: {NODE_OPTIONS: '--loader=ts-node/esm'},
      // })
      // // test un-compiled changes with bin/dev
      // await modifyCommand({executor: linkedPlugin, plugin, from: 'howdy', to: 'cheers'})
      // await runCommand({
      //   executor: esmExecutor,
      //   plugin,
      //   script: 'dev',
      //   expectStrings: ['cheers', plugin.hookText],
      //   env: {NODE_OPTIONS: '--loader=ts-node/esm'},
      // })

      await cleanUp({executor: esmExecutor, plugin, script: 'run'})
    })
  }

  const preCoreTests = async () => {
    await test('Install pre-core plugin to ESM root plugin', async () => {
      await installTest(PLUGINS.precore, esmExecutor)
    })

    await test('Install pre-core plugin to CJS root plugin', async () => {
      await installTest(PLUGINS.precore, cjsExecutor)
    })

    await test('Link pre-core plugin to CJS root plugin', async () => {
      // Pass in true to skip linking the local version of @oclif/core
      // to the test pre-core plugin since it doesn't use core.
      await linkTest(PLUGINS.precore, cjsExecutor, true)
    })

    await test('Link pre-core plugin to ESM root plugin', async () => {
      // Pass in true to skip linking the local version of @oclif/core
      // to the test pre-core plugin since it doesn't use core.
      await linkTest(PLUGINS.precore, esmExecutor, true)
    })
  }

  const coreV1Tests = async () => {
    await test('Install core v1 plugin to ESM root plugin', async () => {
      await installTest(PLUGINS.coreV1, esmExecutor)
    })

    await test('Install core v1 plugin to CJS root plugin', async () => {
      await installTest(PLUGINS.coreV1, cjsExecutor)
    })

    await test('Link core v1 plugin to CJS root plugin', async () => {
      // Pass in true to skip linking the local version of @oclif/core
      // to plugin-test-core-v1. There are breaking changes to how
      // args are defined in a command so the plugin won't compile if
      // we link the local version of core.
      await linkTest(PLUGINS.coreV1, cjsExecutor, true)
    })

    await test('Link core v1 plugin to ESM root plugin', async () => {
      // Pass in true to skip linking the local version of @oclif/core
      // to plugin-test-core-v1. There are breaking changes to how
      // args are defined in a command so the plugin won't compile if
      // we link the local version of core.
      await linkTest(PLUGINS.coreV1, esmExecutor, true)
    })
  }

  const coreV2Tests = async () => {
    await test('Install core v2 plugin to ESM root plugin', async () => {
      await installTest(PLUGINS.coreV2, esmExecutor)
    })

    await test('Install core v2 plugin to CJS root plugin', async () => {
      await installTest(PLUGINS.coreV2, cjsExecutor)
    })

    await test('Link core v2 plugin to CJS root plugin', async () => {
      await linkTest(PLUGINS.coreV2, cjsExecutor)
    })

    await test('Link core v2 plugin to ESM root plugin', async () => {
      await linkTest(PLUGINS.coreV2, esmExecutor)
    })
  }

  if (tests.includes('cjs')) await cjsBefore()
  if (tests.includes('esm')) await esmBefore()
  if (tests.includes('precore')) await precoreBefore()
  if (tests.includes('coreV1')) await coreV1Before()
  if (tests.includes('coreV2')) await coreV2Before()

  if (tests.includes('cjs')) await cjsTests()
  if (tests.includes('esm')) await esmTests()
  if (tests.includes('precore')) await preCoreTests()
  if (tests.includes('coreV1')) await coreV1Tests()
  if (tests.includes('coreV2')) await coreV2Tests()

  return {passed, failed}
}

class InteropTest extends Command {
  static description = 'Execute interoperability tests'
  static flags = {
    test: Flags.option({
      description: 'Run a specific test',
      options: TESTS,
      required: true,
      multiple: true,
    })(),
    'dev-run-time': Flags.option({
      description: 'Set the dev runtime to use when executing bin/dev.js',
      options: DEV_RUN_TIMES,
      default: 'default',
    })(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InteropTest)

    this.log('Node version:', process.version)
    this.log('Running tests:', flags.test.join(', '))
    this.log('Dev runtime:', flags['dev-run-time'])

    const results = await testRunner({tests: flags.test, devRunTime: flags['dev-run-time']})

    this.processResults(results)
  }

  private processResults({failed, passed}: {failed: string[]; passed: string[]}): never {
    this.log()
    this.log(chalk.bold('#### Summary ####'))

    for (const name of passed) this.log(chalk.green('✓'), name)

    for (const name of failed) this.log(chalk.red('𐄂'), name)

    this.log(`${chalk.green('Passed:')} ${passed.length}`)
    this.log(`${chalk.red('Failed:')} ${failed.length}`)

    this.exit(failed.length)
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
;(async () => {
  InteropTest.run().then(
    async () => flush(),
    async (error) => handle(error),
  )
})()
