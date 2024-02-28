import {expect} from 'chai'
import {resolve} from 'node:path'
import {SinonSandbox, createSandbox} from 'sinon'

import {run, ux} from '../../src/index'

describe('plugins defined as patterns in package.json', () => {
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    sandbox.stub(ux.write, 'stdout')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should load all core plugins in dependencies that match pattern', async () => {
    const result = (await run(['plugins', '--core'], {
      root: resolve(__dirname, 'fixtures/wildcard/package.json'),
      pluginAdditions: {
        core: ['@oclif/plugin-*'],
        path: resolve(__dirname, '..', '..'),
      },
    })) as Array<{name: string; type: string}>

    expect(result.length).to.equal(3)
    const rootPlugin = result.find((r) => r.name === 'wildcard-plugins-fixture')
    const pluginHelp = result.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result.find((r) => r.name === '@oclif/plugin-plugins')

    expect(rootPlugin).to.exist
    expect(pluginHelp).to.exist
    expect(pluginPlugins).to.exist
  })

  it('should load all dev plugins in dependencies and devDependencies that match pattern', async () => {
    const result = (await run(['plugins', '--core'], {
      root: resolve(__dirname, 'fixtures/wildcard/package.json'),
      pluginAdditions: {
        dev: ['@oclif/plugin-*'],
        path: resolve(__dirname, '..', '..'),
      },
    })) as Array<{name: string; type: string}>

    expect(result.length).to.equal(3)
    const rootPlugin = result.find((r) => r.name === 'wildcard-plugins-fixture')
    const pluginHelp = result.find((r) => r.name === '@oclif/plugin-help')
    const pluginPlugins = result.find((r) => r.name === '@oclif/plugin-plugins')

    expect(rootPlugin).to.exist
    expect(pluginHelp).to.exist
    expect(pluginPlugins).to.exist
  })
})
