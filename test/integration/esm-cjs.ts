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

async function describe(name: string, fn: () => Promise<void>) {
  console.log()
  console.log(`#### ${bold(name)} ####`)
  await fn()
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
  expectString?: string;
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
    },
    esm2: {
      name: 'plugin-test-esm-2',
      command: 'esm2',
      package: '@oclif/plugin-test-esm-2',
      repo: 'https://github.com/oclif/plugin-test-esm-2',
    },
    cjs1: {
      name: 'plugin-test-cjs-1',
      command: 'cjs1',
      package: '@oclif/plugin-test-cjs-1',
      repo: 'https://github.com/oclif/plugin-test-cjs-1',
    },
    cjs2: {
      name: 'plugin-test-cjs-2',
      command: 'cjs2',
      package: '@oclif/plugin-test-cjs-2',
      repo: 'https://github.com/oclif/plugin-test-cjs-2',
    },
  }

  async function installPlugin(options: InstallPluginOptions): Promise<void> {
    const result = await options.executor.executeCommand(`plugins:install ${options.plugin.package}`, options.script)
    expect(result.code).to.equal(0)

    const pluginsResult = await options.executor.executeCommand('plugins', options.script)
    expect(pluginsResult.stdout).to.include(options.plugin.name)
  }

  async function linkPlugin(options: LinkPluginOptions): Promise<Executor> {
    const pluginExecutor = await setup(__filename, {repo: options.plugin.repo})

    const result = await options.executor.executeCommand(`plugins:link ${pluginExecutor.testDir}`, options.script)
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

    if (options.expectString) {
      expect(result.stdout).to.include(options.expectString)
    }
  }

  async function cleanUp(options: CleanUpOptions): Promise<void> {
    await options.executor.executeCommand(`plugins:uninstall @oclif/${options.plugin}`)
    expect((await options.executor.executeCommand('plugins')).stdout).to.not.include(options.plugin)
  }

  await describe('CJS Root Plugin', async () => {
    process.env.CJS1_PLUGINS_INSTALL_USE_SPAWN = 'true'
    const executor = await setup(__filename, {repo: PLUGINS.cjs1.repo})

    await test('Install CJS plugin (bin/run)', async () => {
      const plugin = PLUGINS.cjs2
      const script = 'run'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Install CJS plugin (bin/dev)', async () => {
      const plugin = PLUGINS.cjs2
      const script = 'dev'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Install ESM plugin (bin/run)', async () => {
      const plugin = PLUGINS.esm1
      const script = 'run'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script: 'run'})
      await cleanUp({executor, plugin, script})
    })

    await test('Install ESM plugin (bin/dev)', async () => {
      const plugin = PLUGINS.esm1
      const script = 'dev'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script: 'dev'})
      await cleanUp({executor, plugin, script})
    })

    await test('Link CJS plugin (bin/run)', async () => {
      const plugin = PLUGINS.cjs2
      const script = 'run'

      const linkedPlugin = await linkPlugin({executor, plugin, script})

      await runCommand({executor, plugin, script, expectString: 'hello'})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})

      await cleanUp({executor, plugin, script})
    })

    await test('Link CJS plugin (bin/dev)', async () => {
      const plugin = PLUGINS.cjs2
      const script = 'dev'

      const linkedPlugin = await linkPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script: 'dev', expectString: 'hello'})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})
      await cleanUp({executor, plugin, script})
    })
  })

  await describe('ESM Root Plugin', async () => {
    process.env.ESM1_PLUGINS_INSTALL_USE_SPAWN = 'true'
    const executor = await setup(__filename, {repo: PLUGINS.esm1.repo})

    await test('Install CJS plugin (bin/run)', async () => {
      const plugin = PLUGINS.cjs1
      const script = 'run'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Install CJS plugin (bin/dev)', async () => {
      const plugin = PLUGINS.cjs1
      const script = 'dev'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Install ESM plugin (bin/run)', async () => {
      const plugin = PLUGINS.esm2
      const script = 'run'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Install ESM plugin (bin/dev)', async () => {
      const plugin = PLUGINS.esm2
      const script = 'dev'

      await installPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await cleanUp({executor, plugin, script})
    })

    await test('Link CJS plugin (bin/run)', async () => {
      const plugin = PLUGINS.cjs1
      const script = 'run'

      const linkedPlugin = await linkPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})
      await cleanUp({executor, plugin, script})
    })

    await test('Link CJS plugin (bin/dev)', async () => {
      const plugin = PLUGINS.cjs1
      const script = 'dev'

      const linkedPlugin = await linkPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})
      await cleanUp({executor, plugin, script})
    })

    await test('Link ESM plugin (bin/run)', async () => {
      const plugin = PLUGINS.esm2
      const script = 'dev'

      const linkedPlugin = await linkPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})
      await cleanUp({executor, plugin, script})
    })

    await test('Link ESM plugin (bin/dev)', async () => {
      const plugin = PLUGINS.esm2
      const script = 'dev'

      const linkedPlugin = await linkPlugin({executor, plugin, script})
      await runCommand({executor, plugin, script})
      await modifyCommand(`${linkedPlugin.testDir}/src/commands/${plugin.command}.ts`, 'hello', 'howdy')
      await runCommand({executor, plugin, script, expectString: 'howdy'})
      await cleanUp({executor, plugin, script})
    })
  })

  exit()
})()

