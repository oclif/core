import {expect} from 'chai'
import {resolve} from 'node:path'

import {runCommand} from '../test'

describe('plugins defined as patterns in package.json', () => {
  it('should load all core plugins in dependencies that match pattern', async () => {
    const {result} = await runCommand<Array<{name: string; type: string}>>(['plugins', '--core'], {
      root: resolve(__dirname, 'fixtures/wildcard/package.json'),
      pluginAdditions: {
        core: ['@oclif/plugin-*'],
        path: resolve(__dirname, '..', '..'),
      },
    })

    expect(result.length).to.equal(3)
    const rootPlugin = result.find((r) => r.name === 'wildcard-plugins-fixture')
    const pluginHelp = result.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result.find((r) => r.name === '@oclif/plugin-plugins')

    expect(rootPlugin).to.exist
    expect(pluginHelp).to.exist
    expect(pluginPlugins).to.exist
  })

  it('should load all dev plugins in dependencies and devDependencies that match pattern', async () => {
    const {result} = await runCommand<Array<{name: string; type: string}>>(['plugins', '--core'], {
      root: resolve(__dirname, 'fixtures/wildcard/package.json'),
      pluginAdditions: {
        dev: ['@oclif/plugin-*'],
        path: resolve(__dirname, '..', '..'),
      },
    })

    expect(result.length).to.equal(3)
    const rootPlugin = result.find((r) => r.name === 'wildcard-plugins-fixture')
    const pluginHelp = result.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result.find((r) => r.name === '@oclif/plugin-plugins')

    expect(rootPlugin).to.exist
    expect(pluginHelp).to.exist
    expect(pluginPlugins).to.exist
  })
})
