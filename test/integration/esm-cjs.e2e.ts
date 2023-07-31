import {Executor, setup} from './util'
import {expect, config as chaiConfig} from 'chai'

chaiConfig.truncateThreshold = 0

describe('CJS in CJS', () => {
  let executor: Executor
  before(async () => {
    executor = await setup(__filename, {
      repo: 'https://github.com/oclif/hello-world',
    })

    // clone template repos
    // rename directory, package name, command names
  })

  describe.only('install', () => {
    it('should install the plugin', async () => {
      const result = await executor.executeCommand('plugins:install https://github.com/oclif/hello-world')
      expect(result.code).to.equal(0)

      const pluginsResult = await executor.executeCommand('plugins')
      console.log(pluginsResult)
      expect(pluginsResult.code).to.equal(0)
      expect(pluginsResult.output).to.include('oclif-hello-world')
    })
  })
  describe('link', () => {})
})
