import {expect} from 'chai'
import {join, resolve} from 'node:path'
import sinon from 'sinon'

import {Config, Interfaces} from '../../src'
import {Command} from '../../src/command'
import {Plugin as IPlugin} from '../../src/interfaces'
import * as fs from '../../src/util/fs'
import * as os from '../../src/util/os'

interface Options {
  commandIds?: string[]
  types?: string[]
}

const pjson = {
  name: 'foo',
  version: '1.0.0',
  files: [],
  commands: {},
  oclif: {
    binAliases: ['bar', 'baz'],
    topics: {
      t1: {
        description: 'desc for t1',
        subtopics: {
          't1-1': {
            description: 'desc for t1-1',
            subtopics: {
              't1-1-1': {
                description: 'desc for t1-1-1',
              },
              't1-1-2': {
                description: 'desc for t1-1-2',
              },
            },
          },
        },
      },
    },
  },
}

describe('Config', () => {
  let sandbox: sinon.SinonSandbox
  const originalEnv = {...process.env}
  const root = resolve(__dirname, '..')
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    process.env = {}
  })

  afterEach(() => {
    sandbox.restore()
    process.env = originalEnv
  })

  describe('binAliases', () => {
    it('will have binAliases set', async () => {
      const config = await Config.load({pjson, root})

      expect(config.binAliases).to.deep.equal(['bar', 'baz'])
    })

    it('will get scoped env vars with bin aliases', async () => {
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarKeys('abc')).to.deep.equal(['FOO_ABC', 'BAR_ABC', 'BAZ_ABC'])
    })

    it('will get scoped env vars', async () => {
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarKey('abc')).to.equal('FOO_ABC')
    })

    it('will get scopedEnvVar', async () => {
      process.env.FOO_ABC = 'find me'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVar('abc')).to.deep.equal('find me')
    })

    it('will get scopedEnvVar via alias', async () => {
      process.env.BAZ_ABC = 'find me'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVar('abc')).to.deep.equal('find me')
    })

    it('will get scoped env vars', async () => {
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarKey('abc')).to.equal('FOO_ABC')
    })

    it('will get scopedEnvVarTrue', async () => {
      process.env.FOO_ABC = 'true'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
    })

    it('will get scopedEnvVarTrue via alias', async () => {
      process.env.BAR_ABC = 'true'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
    })

    it('will get scopedEnvVarTrue=1', async () => {
      process.env.FOO_ABC = '1'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
    })

    it('will get scopedEnvVarTrue=1 via alias', async () => {
      process.env.BAR_ABC = '1'
      const config = await Config.load({pjson, root})
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
    })
  })

  describe('darwin', () => {
    it('should have darwin specific paths', async () => {
      sandbox.stub(os, 'getHomeDir').returns(join('/my/home'))
      sandbox.stub(os, 'getPlatform').returns('darwin')
      const config = await Config.load()

      expect(config).to.have.property('cacheDir', join('/my/home/Library/Caches/@oclif/core'))
      expect(config).to.have.property('configDir', join('/my/home/.config/@oclif/core'))
      expect(config).to.have.property('errlog', join('/my/home/Library/Caches/@oclif/core/error.log'))
      expect(config).to.have.property('dataDir', join('/my/home/.local/share/@oclif/core'))
      expect(config).to.have.property('home', join('/my/home'))
    })
  })

  describe('linux', () => {
    it('should have linux specific paths', async () => {
      sandbox.stub(os, 'getHomeDir').returns(join('/my/home'))
      sandbox.stub(os, 'getPlatform').returns('linux')
      const config = await Config.load()

      expect(config).to.have.property('cacheDir', join('/my/home/.cache/@oclif/core'))
      expect(config).to.have.property('configDir', join('/my/home/.config/@oclif/core'))
      expect(config).to.have.property('errlog', join('/my/home/.cache/@oclif/core/error.log'))
      expect(config).to.have.property('dataDir', join('/my/home/.local/share/@oclif/core'))
      expect(config).to.have.property('home', join('/my/home'))
    })
  })

  describe('win32', () => {
    it('should have win32 specific paths', async () => {
      sandbox.stub(os, 'getHomeDir').returns('/my/home')
      sandbox.stub(os, 'getPlatform').returns('win32')
      process.env.LOCALAPPDATA = '/my/home/localappdata'
      const config = await Config.load()

      expect(config).to.have.property('cacheDir', join('/my/home/localappdata/@oclif\\core'))
      expect(config).to.have.property('configDir', join('/my/home/localappdata/@oclif\\core'))
      expect(config).to.have.property('errlog', join('/my/home/localappdata/@oclif\\core/error.log'))
      expect(config).to.have.property('dataDir', join('/my/home/localappdata/@oclif\\core'))
      expect(config).to.have.property('home', join('/my/home'))
    })
  })

  describe('s3Key', async () => {
    const target = {platform: 'darwin', arch: 'x64'}
    const beta = {version: '2.0.0-beta', channel: 'beta'}
    let config: Config

    before(async () => {
      config = await Config.load()
      // Config.load reads the package.json to determine the version and channel
      // In order to allow prerelease branches to pass, we need to strip the prerelease
      // tag from the version and switch the channel to stable.
      config.version = config.version.replaceAll(/-beta\.\d/g, '')
      config.channel = 'stable'
    })

    const tests: Array<{
      key: keyof Interfaces.PJSON.S3.Templates
      expected: string
      extra?: Record<string, string> & {ext?: '.tar.gz' | '.tar.xz' | Interfaces.Config.s3Key.Options}
    }> = [
      {key: 'baseDir', expected: 'oclif-cli'},
      {key: 'manifest', expected: 'version'},
      {key: 'manifest', expected: 'channels/beta/version', extra: beta},
      {key: 'manifest', expected: 'darwin-x64', extra: target},
      {key: 'manifest', expected: 'channels/beta/darwin-x64', extra: {...beta, ...target}},
      {key: 'unversioned', expected: 'oclif-cli.tar.gz'},
      {key: 'unversioned', expected: 'oclif-cli.tar.gz'},
      {key: 'unversioned', expected: 'channels/beta/oclif-cli.tar.gz', extra: beta},
      {key: 'unversioned', expected: 'channels/beta/oclif-cli.tar.gz', extra: beta},
      {key: 'unversioned', expected: 'oclif-cli-darwin-x64.tar.gz', extra: target},
      {key: 'unversioned', expected: 'oclif-cli-darwin-x64.tar.gz', extra: target},
      {key: 'unversioned', expected: 'channels/beta/oclif-cli-darwin-x64.tar.gz', extra: {...beta, ...target}},
      {key: 'unversioned', expected: 'channels/beta/oclif-cli-darwin-x64.tar.gz', extra: {...beta, ...target}},
      {key: 'versioned', expected: 'oclif-cli-v1.0.0/oclif-cli-v1.0.0.tar.gz'},
      {key: 'versioned', expected: 'oclif-cli-v1.0.0/oclif-cli-v1.0.0-darwin-x64.tar.gz', extra: target},
      {key: 'versioned', expected: 'channels/beta/oclif-cli-v2.0.0-beta/oclif-cli-v2.0.0-beta.tar.gz', extra: beta},
      {
        key: 'versioned',
        expected: 'channels/beta/oclif-cli-v2.0.0-beta/oclif-cli-v2.0.0-beta-darwin-x64.tar.gz',
        extra: {...beta, ...target},
      },
    ]

    for (const testCase of tests) {
      const {key, expected, extra} = testCase
      let {ext, ...options} = extra ?? {}
      options = {
        bin: 'oclif-cli',
        version: '1.0.0',
        ext: '.tar.gz',
        ...options,
      }
      it(`renders ${key} template as ${expected}`, () => {
        const o = ext ? config.s3Key(key, ext, options) : config.s3Key(key, options)
        expect(o).to.equal(expected)
      })
    }
  })

  describe('options', () => {
    it('should set the channel and version', async () => {
      const config = await Config.load({root, channel: 'test-channel', version: '0.1.2-test'})
      expect(config).to.have.property('channel', 'test-channel')
      expect(config).to.have.property('version', '0.1.2-test')
    })
  })

  it('has s3Url', async () => {
    const config = await Config.load({
      root,
      pjson: {
        ...pjson,
        oclif: {
          ...pjson.oclif,
          update: {
            // @ts-expect-error - not worth stubbing out every single required prop on s3
            s3: {
              host: 'https://bar.com/a/',
            },
          },
        },
      },
    })
    expect(config.s3Url('/b/c')).to.equal('https://bar.com/a/b/c')
  })

  it('has subtopics', async () => {
    const config = await Config.load({root, pjson})
    expect(config.topics.map((t) => t.name)).to.have.members(['t1', 't1:t1-1', 't1:t1-1:t1-1-1', 't1:t1-1:t1-1-2'])
  })

  describe('findCommand', () => {
    async function loadConfig({commandIds = ['foo:bar', 'foo:baz'], types = []}: Options = {}) {
      sandbox.stub(os, 'getHomeDir').returns('/my/home')
      sandbox.stub(os, 'getPlatform').returns('darwin')

      class MyCommandClass extends Command {
        aliases: string[] = []

        hidden = false

        id = 'foo:bar'

        _base = ''

        run(): Promise<any> {
          return Promise.resolve()
        }
      }

      const load = async (): Promise<void> => {}
      const findCommand = async (): Promise<Command.Class> => MyCommandClass

      const commandPluginA: Command.Loadable = {
        strict: false,
        aliases: [],
        args: {},
        flags: {},
        hidden: false,
        hiddenAliases: [],
        id: commandIds[0],
        async load(): Promise<Command.Class> {
          return MyCommandClass
        },
        pluginType: types[0] ?? 'core',
        pluginAlias: '@My/plugina',
      }
      const commandPluginB: Command.Loadable = {
        strict: false,
        aliases: [],
        args: {},
        flags: {},
        hidden: false,
        hiddenAliases: [],
        id: commandIds[1],
        async load(): Promise<Command.Class> {
          return MyCommandClass
        },
        pluginType: types[1] ?? 'core',
        pluginAlias: '@My/pluginb',
      }
      const hooks = {}
      const pluginA: IPlugin = {
        load,
        findCommand,
        name: '@My/plugina',
        alias: '@My/plugina',
        commands: [commandPluginA],
        _base: '',
        pjson,
        commandIDs: [commandIds[0]] as string[],
        root: '',
        version: '0.0.0',
        type: types[0] ?? 'core',
        hooks,
        topics: [],
        valid: true,
        tag: 'tag',
        moduleType: 'commonjs',
        hasManifest: false,
        isRoot: false,
        options: {root: ''},
        commandsDir: './lib/commands',
      }

      const pluginB: IPlugin = {
        load,
        findCommand,
        name: '@My/pluginb',
        alias: '@My/pluginb',
        commands: [commandPluginB],
        _base: '',
        pjson,
        commandIDs: [commandIds[1]] as string[],
        root: '',
        version: '0.0.0',
        type: types[1] ?? 'core',
        hooks,
        topics: [],
        valid: true,
        tag: 'tag',
        moduleType: 'commonjs',
        hasManifest: false,
        isRoot: false,
        options: {root: ''},
        commandsDir: './lib/commands',
      }
      const plugins = new Map().set(pluginA.name, pluginA).set(pluginB.name, pluginB)

      const config = await Config.load({
        root,
        pjson,
      })
      config.plugins = plugins
      config.pjson = {
        ...pjson,
        dependencies: {
          '@My/pluginb': '0.0.0',
          '@My/plugina': '0.0.0',
        },
        oclif: {
          ...pjson.oclif,
          plugins: ['@My/pluginb', '@My/plugina'],
        },
      }
      for (const plugin of config.plugins.values()) {
        // @ts-expect-error private method
        config.loadCommands(plugin)
        // @ts-expect-error private method
        config.loadTopics(plugin)
      }

      return config
    }

    it('find command with no duplicates', async () => {
      const config = await loadConfig()
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })

    it('find command with duplicates and choose the one that appears first in oclif.plugins', async () => {
      const config = await loadConfig({commandIds: ['foo:bar', 'foo:bar']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('pluginAlias', '@My/pluginb')
    })

    it('find command with no duplicates core/user', async () => {
      const config = await loadConfig({types: ['core', 'user']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })

    it('find command with no duplicates user/core', async () => {
      const config = await loadConfig({types: ['user', 'core']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'user')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })

    it('find command with duplicates core/user', async () => {
      const config = await loadConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['core', 'user']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })

    it('find command with duplicates user/core', async () => {
      const config = await loadConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'core']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/pluginb')
    })

    it('find command with duplicates user/user', async () => {
      const config = await loadConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'user']})
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'user')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
  })

  describe('theme', () => {
    it('should not be set when DISABLE_THEME is true and theme.json exists', async () => {
      process.env.FOO_DISABLE_THEME = 'true'
      sandbox.stub(fs, 'safeReadJson').resolves({bin: '#FF0000'})
      const config = await Config.load({root, pjson})
      expect(config).to.have.property('theme', undefined)
    })

    it('should be set when DISABLE_THEME is false and theme.json exists', async () => {
      process.env.FOO_DISABLE_THEME = 'false'
      sandbox.stub(fs, 'safeReadJson').resolves({bin: '#FF0000'})
      const config = await Config.load({root, pjson})
      expect(config.theme).to.have.property('bin', '#FF0000')
    })

    it('should be set when DISABLE_THEME is unset and theme.json exists', async () => {
      sandbox.stub(fs, 'safeReadJson').resolves({bin: '#FF0000'})
      const config = await Config.load({root, pjson})
      expect(config.theme).to.have.property('bin', '#FF0000')
    })

    it('should not be set when DISABLE_THEME is true and theme.json does not exist', async () => {
      process.env.FOO_DISABLE_THEME = 'true'
      sandbox.stub(fs, 'safeReadJson').resolves()
      const config = await Config.load({root, pjson})
      expect(config).to.have.property('theme', undefined)
    })

    it('should not be set when DISABLE_THEME is false and theme.json does not exist', async () => {
      process.env.FOO_DISABLE_THEME = 'false'
      sandbox.stub(fs, 'safeReadJson').resolves()
      const config = await Config.load({root, pjson})
      expect(config).to.have.property('theme', undefined)
    })

    it('should not be set when DISABLE_THEME is unset and theme.json does not exist', async () => {
      sandbox.stub(fs, 'safeReadJson').resolves()
      const config = await Config.load({root, pjson})
      expect(config).to.have.property('theme', undefined)
    })
  })
})
