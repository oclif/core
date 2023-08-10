/**
 * These integration tests do not use mocha because we encountered an issue with
 * spawning child processes for testing root ESM plugins with linked ESM plugins.
 * This scenario works as expected when running outside of mocha.
 *
 * Instead of spending more time diagnosing the root cause, we are just going to
 * run these integration tests using ts-node and a lightweight homemade test runner.
 */
import {Executor, setup} from './util'
import {expect} from 'chai'
import {bold, cyan, green, red} from 'chalk'
import {replaceInFile} from 'replace-in-file'

const FAILED: string[] = []
const PASSED: string[] = []

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    PASSED.push(name)
    console.log(green('✓'), name)
  } catch (error) {
    FAILED.push(name)
    const err = error as Chai.AssertionError & {expected?: string; actual?: string}
    const formattedMessage = err.message
    .replace(err.expected ?? '', cyan(err.expected))
    .replace(err.actual ?? '', red(err.actual))

    console.log(red('𐄂'), name)
    console.log(`  • ${formattedMessage}`)
  }
}

function exit(): never {
  console.log()
  console.log(bold('#### Summary ####'))

  for (const name of PASSED) {
    console.log(green('✓'), name)
  }

  for (const name of FAILED) {
    console.log(red('𐄂'), name)
  }

  console.log(`${green('Passed:')} ${PASSED.length}`)
  console.log(`${red('Failed:')} ${FAILED.length}`)

  // eslint-disable-next-line no-process-exit, unicorn/no-process-exit
  process.exit(FAILED.length)
}

type Plugin = {
  name: string;
  command: string;
  package: string;
  repo: string;
}

type Script = 'run' | 'dev'

type InstallPluginOptions = {
  executor: Executor;
  plugin: Plugin;
  script: Script;
}

type LinkPluginOptions = {
  executor: Executor;
  plugin: Plugin;
  script: Script;
}

type RunCommandOptions = {
  executor: Executor;
  plugin: Plugin;
  script: Script;
  expectStrings?: string[];
}

type CleanUpOptions = {
  executor: Executor;
  script: Script;
  plugin: Plugin;
}

(async () => {
  const PLUGINS = {
    esm1: {
      name: 'plugin-test-esm-1',
      command: 'esm1',
      package: '@oclif/plugin-test-esm-1',
      repo: 'https://github.com/oclif/plugin-test-esm-1',
      commandText: 'hello I am an ESM plugin',
      hookText: 'Greetings! from plugin-test-esm-1 init hook',
    },
    esm2: {
      name: 'plugin-test-esm-2',
      command: 'esm2',
      package: '@oclif/plugin-test-esm-2',
      repo: 'https://github.com/oclif/plugin-test-esm-2',
      commandText: 'hello I am an ESM plugin',
      hookText: 'Greetings! from plugin-test-esm-2 init hook',
    },
    cjs1: {
      name: 'plugin-test-cjs-1',
      command: 'cjs1',
      package: '@oclif/plugin-test-cjs-1',
      repo: 'https://github.com/oclif/plugin-test-cjs-1',
      commandText: 'hello I am a CJS plugin',
      hookText: 'Greetings! from plugin-test-cjs-1 init hook',
    },
    cjs2: {
      name: 'plugin-test-cjs-2',
      command: 'cjs2',
      package: '@oclif/plugin-test-cjs-2',
      repo: 'https://github.com/oclif/plugin-test-cjs-2',
      commandText: 'hello I am a CJS plugin',
      hookText: 'Greetings! from plugin-test-cjs-2 init hook',
    },
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
    })

    const result = await options.executor.executeCommand(`plugins:link ${pluginExecutor.pluginDir}`, options.script)
    expect(result.code).to.equal(0)

    const pluginsResult = await options.executor.executeCommand('plugins', options.script)
    expect(pluginsResult.stdout).to.include(options.plugin.name)

    return pluginExecutor
  }

  async function modifyCommand(files: string, from: string, to: string): Promise<void> {
    await replaceInFile({files, from, to})
  }

  async function runCommand(options: RunCommandOptions): Promise<void> {
    const result = await options.executor.executeCommand(options.plugin.command, options.script)
    expect(result.code).to.equal(0)

    if (options.expectStrings) {
      for (const expectString of options.expectStrings) {
        expect(result.stdout).to.include(expectString)
      }
    }
  }

  async function cleanUp(options: CleanUpOptions): Promise<void> {
    await options.executor.executeCommand(`plugins:uninstall @oclif/${options.plugin.name}`)
    expect((await options.executor.executeCommand('plugins')).stdout).to.not.include(options.plugin.name)
  }

  const args = process.argv.slice(process.argv.indexOf(__filename) + 1)
  const runInParallel = args.includes('--parallel')
  console.log(runInParallel ? '🐇 Running tests in parallel' : '🐢 Running tests sequentially')

  process.env.ESM1_PLUGINS_INSTALL_USE_SPAWN = 'true'
  process.env.CJS1_PLUGINS_INSTALL_USE_SPAWN = 'true'
  process.env.DEBUG = 'e2e:*'
  const esmExecutor = await setup(__filename, {repo: PLUGINS.esm1.repo, subDir: 'esm'})
  const cjsExecutor = await setup(__filename, {repo: PLUGINS.cjs1.repo, subDir: 'cjs'})

  const cjsTests = async () => {
    await test('Install CJS plugin to CJS root plugin', async () => {
      const plugin = PLUGINS.cjs2

      await installPlugin({executor: cjsExecutor, plugin, script: 'run'})
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'dev',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await cleanUp({executor: cjsExecutor, plugin, script: 'run'})
    })

    await test('Install ESM plugin to CJS root plugin', async () => {
      const plugin = PLUGINS.esm1

      await installPlugin({executor: cjsExecutor, plugin, script: 'run'})
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'dev',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await cleanUp({executor: cjsExecutor, plugin, script: 'run'})
    })

    await test('Link CJS plugin to CJS root plugin', async () => {
      const plugin = PLUGINS.cjs2

      const linkedPlugin = await linkPlugin({executor: cjsExecutor, plugin, script: 'run'})

      // test bin/run
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      // test un-compiled changes with bin/run
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'run',
        expectStrings: ['howdy', plugin.hookText],
      })

      // test un-compiled changes with bin/dev
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'howdy', 'cheers')
      await runCommand({
        executor: cjsExecutor,
        plugin,
        script: 'dev',
        expectStrings: ['cheers', plugin.hookText],
      })

      await cleanUp({executor: cjsExecutor, plugin, script: 'run'})
    })
  }

  const esmTests = async () => {
    await test('Install CJS plugin to ESM root plugin', async () => {
      const plugin = PLUGINS.cjs1

      await installPlugin({executor: esmExecutor, plugin, script: 'run'})
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'dev',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await cleanUp({executor: esmExecutor, plugin, script: 'run'})
    })

    await test('Install ESM plugin to ESM root plugin', async () => {
      const plugin = PLUGINS.esm2

      await installPlugin({executor: esmExecutor, plugin, script: 'run'})
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'dev',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      await cleanUp({executor: esmExecutor, plugin, script: 'run'})
    })

    await test('Link CJS plugin to ESM root plugin', async () => {
      const plugin = PLUGINS.cjs1

      const linkedPlugin = await linkPlugin({executor: esmExecutor, plugin, script: 'run'})
      // test bin/run
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      // test un-compiled changes with bin/run
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: ['howdy', plugin.hookText],
      })

      // test un-compiled changes with bin/dev
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'howdy', 'cheers')
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'dev',
        expectStrings: ['cheers', plugin.hookText],
      })

      await cleanUp({executor: esmExecutor, plugin, script: 'run'})
    })

    await test('Link ESM plugin to ESM root plugin', async () => {
      const plugin = PLUGINS.esm2

      const linkedPlugin = await linkPlugin({executor: esmExecutor, plugin, script: 'run'})
      // test bin/run
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: [plugin.commandText, plugin.hookText],
      })
      // test un-compiled changes with bin/run
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'run',
        expectStrings: ['howdy', plugin.hookText],
      })

      // test un-compiled changes with bin/dev
      await modifyCommand(`${linkedPlugin.pluginDir}/src/commands/${plugin.command}.ts`, 'howdy', 'cheers')
      await runCommand({
        executor: esmExecutor,
        plugin,
        script: 'dev',
        expectStrings: ['cheers', plugin.hookText],
      })

      await cleanUp({executor: esmExecutor, plugin, script: 'run'})
    })
  }

  if (runInParallel) {
    await Promise.all([cjsTests(), esmTests()])
  } else {
    await cjsTests()
    await esmTests()
  }

  exit()
})()

