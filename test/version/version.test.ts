import {expect} from 'chai'
import {resolve} from 'node:path'

import {Config} from '../../src'
import {loadVersionClass} from '../../src/version'
import configuredVersionClass from './_test-version-class'
import {MyVersion} from './_test-version-class-identifier'

describe('loadVersionClass', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  it('defaults to the native version class', async () => {
    delete config.pjson.oclif.versionClass

    const versionClass = await loadVersionClass(config)
    expect(versionClass).not.be.undefined
    expect(versionClass.prototype.showVersion)
  })

  it('loads version class defined in pjson.oclif.versionClass', async () => {
    config.pjson.oclif.versionClass = '../test/version/_test-version-class'
    config.root = resolve(__dirname, '..')

    expect(configuredVersionClass).to.not.be.undefined
    expect(await loadVersionClass(config)).to.deep.equal(configuredVersionClass)
  })

  it('loads version class defined using target but no identifier', async () => {
    config.pjson.oclif.versionClass = {
      target: '../test/version/_test-version-class',
      // @ts-expect-error for testing purposes
      identifier: undefined,
    }
    config.root = resolve(__dirname, '..')

    expect(configuredVersionClass).to.not.be.undefined
    expect(await loadVersionClass(config)).to.deep.equal(configuredVersionClass)
  })

  it('loads version class defined using target and identifier', async () => {
    config.pjson.oclif.versionClass = {
      target: '../test/version/_test-version-class-identifier',
      identifier: 'MyVersion',
    }
    config.root = resolve(__dirname, '..')

    expect(MyVersion).to.not.be.undefined
    expect(await loadVersionClass(config)).to.deep.equal(MyVersion)
  })

  describe('error cases', () => {
    it('throws an error when failing to load the version class defined in pjson.oclif.versionClass', async () => {
      config.pjson.oclif.versionClass = './lib/does-not-exist-version-class'
      await expect(loadVersionClass(config)).to.be.rejectedWith(
        'Unable to load configured version class "./lib/does-not-exist-version-class", failed with message:',
      )
    })
  })
})
