import {join} from 'node:path'

import {Config, Interfaces} from '../../src'
import {Command} from '../../src/command'
import {Plugin as IPlugin} from '../../src/interfaces'
import * as fs from '../../src/util/fs'
import * as os from '../../src/util/os'
import {expect, fancy} from './test'

interface Options {
  commandIds?: string[]
  env?: {[k: string]: string}
  homedir?: string
  pjson?: any
  platform?: string
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
  const testConfig = ({pjson, homedir = '/my/home', platform = 'darwin', env = {}}: Options = {}, theme?: any) => {
    let test = fancy
      .resetConfig()
      .env(env, {clear: true})
      .stub(os, 'getHomeDir', (stub) => stub.returns(join(homedir)))
      .stub(os, 'getPlatform', (stub) => stub.returns(platform))

    if (theme) test = test.stub(fs, 'safeReadJson', (stub) => stub.resolves(theme))
    if (pjson) test = test.stub(fs, 'readJson', (stub) => stub.resolves(pjson))

    test = test.add('config', () => Config.load())

    return {
      hasS3Key(k: keyof Interfaces.PJSON.S3.Templates, expected: string, extra: any = {}) {
        return this.it(`renders ${k} template as ${expected}`, (config) => {
          // Config.load reads the package.json to determine the version and channel
          // In order to allow prerelease branches to pass, we need to strip the prerelease
          // tag from the version and switch the channel to stable.
          // @ts-expect-error because readonly property
          config.version = config.version.replaceAll(/-beta\.\d/g, '')
          // @ts-expect-error because readonly property
          config.channel = 'stable'

          let {ext, ...options} = extra
          options = {
            bin: 'oclif-cli',
            version: '1.0.0',
            ext: '.tar.gz',
            ...options,
          }
          const o = ext ? config.s3Key(k as any, ext, options) : config.s3Key(k, options)
          expect(o).to.equal(expected)
        })
      },
      hasProperty<K extends keyof Interfaces.Config>(k: K | undefined, v: Interfaces.Config[K] | undefined) {
        return this.it(`has ${k}=${v}`, (config) => expect(config).to.have.property(k!, v))
      },
      it(expectation: string, fn: (config: Interfaces.Config) => any) {
        test.do(({config}) => fn(config)).it(expectation)
        return this
      },
    }
  }

  describe('darwin', () => {
    testConfig()
      .hasProperty('cacheDir', join('/my/home/Library/Caches/@oclif/core'))
      .hasProperty('configDir', join('/my/home/.config/@oclif/core'))
      .hasProperty('errlog', join('/my/home/Library/Caches/@oclif/core/error.log'))
      .hasProperty('dataDir', join('/my/home/.local/share/@oclif/core'))
      .hasProperty('home', join('/my/home'))
  })

  describe('binAliases', () => {
    testConfig({pjson}).it('will have binAliases set', (config) => {
      expect(config.binAliases).to.deep.equal(['bar', 'baz'])
    })

    testConfig({pjson}).it('will get scoped env vars with bin aliases', (config) => {
      expect(config.scopedEnvVarKeys('abc')).to.deep.equal(['FOO_ABC', 'BAR_ABC', 'BAZ_ABC'])
    })

    testConfig({pjson}).it('will get scoped env vars', (config) => {
      expect(config.scopedEnvVarKey('abc')).to.equal('FOO_ABC')
    })

    testConfig({pjson}).it('will get scopedEnvVar', (config) => {
      process.env.FOO_ABC = 'find me'
      expect(config.scopedEnvVar('abc')).to.deep.equal('find me')
      delete process.env.FOO_ABC
    })

    testConfig({pjson}).it('will get scopedEnvVar via alias', (config) => {
      process.env.BAZ_ABC = 'find me'
      expect(config.scopedEnvVar('abc')).to.deep.equal('find me')
      delete process.env.BAZ_ABC
    })

    testConfig({pjson}).it('will get scoped env vars', (config) => {
      expect(config.scopedEnvVarKey('abc')).to.equal('FOO_ABC')
    })

    testConfig({pjson}).it('will get scopedEnvVarTrue', (config) => {
      process.env.FOO_ABC = 'true'
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
      delete process.env.FOO_ABC
    })

    testConfig({pjson}).it('will get scopedEnvVarTrue via alias', (config) => {
      process.env.BAR_ABC = 'true'
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
      delete process.env.BAR_ABC
    })

    testConfig({pjson}).it('will get scopedEnvVarTrue=1', (config) => {
      process.env.FOO_ABC = '1'
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
      delete process.env.FOO_ABC
    })

    testConfig({pjson}).it('will get scopedEnvVarTrue=1 via alias', (config) => {
      process.env.BAR_ABC = '1'
      expect(config.scopedEnvVarTrue('abc')).to.equal(true)
      delete process.env.BAR_ABC
    })
  })

  describe('linux', () => {
    testConfig({platform: 'linux'})
      .hasProperty('cacheDir', join('/my/home/.cache/@oclif/core'))
      .hasProperty('configDir', join('/my/home/.config/@oclif/core'))
      .hasProperty('errlog', join('/my/home/.cache/@oclif/core/error.log'))
      .hasProperty('dataDir', join('/my/home/.local/share/@oclif/core'))
      .hasProperty('home', join('/my/home'))
  })

  describe('win32', () => {
    testConfig({
      platform: 'win32',
      env: {LOCALAPPDATA: '/my/home/localappdata'},
    })
      .hasProperty('cacheDir', join('/my/home/localappdata/@oclif\\core'))
      .hasProperty('configDir', join('/my/home/localappdata/@oclif\\core'))
      .hasProperty('errlog', join('/my/home/localappdata/@oclif\\core/error.log'))
      .hasProperty('dataDir', join('/my/home/localappdata/@oclif\\core'))
      .hasProperty('home', join('/my/home'))
  })

  describe('s3Key', () => {
    const target = {platform: 'darwin', arch: 'x64'}
    const beta = {version: '2.0.0-beta', channel: 'beta'}
    testConfig()
      .hasS3Key('baseDir', 'oclif-cli')
      .hasS3Key('manifest', 'version')
      .hasS3Key('manifest', 'channels/beta/version', beta)
      .hasS3Key('manifest', 'darwin-x64', target)
      .hasS3Key('manifest', 'channels/beta/darwin-x64', {...beta, ...target})
      .hasS3Key('unversioned', 'oclif-cli.tar.gz')
      .hasS3Key('unversioned', 'oclif-cli.tar.gz')
      .hasS3Key('unversioned', 'channels/beta/oclif-cli.tar.gz', beta)
      .hasS3Key('unversioned', 'channels/beta/oclif-cli.tar.gz', beta)
      .hasS3Key('unversioned', 'oclif-cli-darwin-x64.tar.gz', target)
      .hasS3Key('unversioned', 'oclif-cli-darwin-x64.tar.gz', target)
      .hasS3Key('unversioned', 'channels/beta/oclif-cli-darwin-x64.tar.gz', {...beta, ...target})
      .hasS3Key('unversioned', 'channels/beta/oclif-cli-darwin-x64.tar.gz', {...beta, ...target})
      .hasS3Key('versioned', 'oclif-cli-v1.0.0/oclif-cli-v1.0.0.tar.gz')
      .hasS3Key('versioned', 'oclif-cli-v1.0.0/oclif-cli-v1.0.0-darwin-x64.tar.gz', target)
      .hasS3Key('versioned', 'channels/beta/oclif-cli-v2.0.0-beta/oclif-cli-v2.0.0-beta.tar.gz', beta)
      .hasS3Key('versioned', 'channels/beta/oclif-cli-v2.0.0-beta/oclif-cli-v2.0.0-beta-darwin-x64.tar.gz', {
        ...beta,
        ...target,
      })
  })

  describe('options', () => {
    it('should set the channel and version', async () => {
      const config = new Config({root: process.cwd(), channel: 'test-channel', version: '0.1.2-test'})
      await config.load()
      expect(config).to.have.property('channel', 'test-channel')
      expect(config).to.have.property('version', '0.1.2-test')
    })
  })

  testConfig().it('has s3Url', (config) => {
    const orig = config.pjson.oclif.update.s3.host
    config.pjson.oclif.update.s3.host = 'https://bar.com/a/'
    expect(config.s3Url('/b/c')).to.equal('https://bar.com/a/b/c')
    config.pjson.oclif.update.s3.host = orig
  })

  testConfig({
    pjson,
  }).it('has subtopics', (config) => {
    expect(config.topics.map((t) => t.name)).to.have.members(['t1', 't1:t1-1', 't1:t1-1:t1-1-1', 't1:t1-1:t1-1-2'])
  })

  describe('findCommand', () => {
    const findCommandTestConfig = ({
      pjson,
      homedir = '/my/home',
      platform = 'darwin',
      env = {},
      commandIds = ['foo:bar', 'foo:baz'],
      types = [],
    }: Options = {}) => {
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
      let test = fancy
        .resetConfig()
        .env(env, {clear: true})
        .stub(os, 'getHomeDir', (stub) => stub.returns(join(homedir)))
        .stub(os, 'getPlatform', (stub) => stub.returns(platform))

      if (pjson) test = test.stub(fs, 'readJson', (stub) => stub.resolves(pjson))
      test = test.add('config', async () => {
        const config = await Config.load()
        config.plugins = plugins
        config.pjson.oclif.plugins = ['@My/pluginb', '@My/plugina']
        config.pjson.dependencies = {'@My/pluginb': '0.0.0', '@My/plugina': '0.0.0'}
        for (const plugin of config.plugins.values()) {
          // @ts-expect-error private method
          config.loadCommands(plugin)
          // @ts-expect-error private method
          config.loadTopics(plugin)
        }

        return config
      })
      // @ts-ignore
      return {
        it(expectation: string, fn: (config: Interfaces.Config) => any) {
          test.do(({config}) => fn(config)).it(expectation)
          return this
        },
      }
    }

    findCommandTestConfig().it('find command with no duplicates', (config) => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar']}).it(
      'find command with duplicates and choose the one that appears first in oclif.plugins',
      (config) => {
        const command = config.findCommand('foo:bar', {must: true})
        expect(command).to.have.property('pluginAlias', '@My/pluginb')
      },
    )
    findCommandTestConfig({types: ['core', 'user']}).it('find command with no duplicates core/user', (config) => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({types: ['user', 'core']}).it('find command with no duplicates user/core', (config) => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'user')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['core', 'user']}).it(
      'find command with duplicates core/user',
      (config) => {
        const command = config.findCommand('foo:bar', {must: true})
        expect(command).to.have.property('id', 'foo:bar')
        expect(command).to.have.property('pluginType', 'core')
        expect(command).to.have.property('pluginAlias', '@My/plugina')
      },
    )
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'core']}).it(
      'find command with duplicates user/core',
      (config) => {
        const command = config.findCommand('foo:bar', {must: true})
        expect(command).to.have.property('id', 'foo:bar')
        expect(command).to.have.property('pluginType', 'core')
        expect(command).to.have.property('pluginAlias', '@My/pluginb')
      },
    )
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'user']}).it(
      'find command with duplicates user/user',
      (config) => {
        const command = config.findCommand('foo:bar', {must: true})
        expect(command).to.have.property('id', 'foo:bar')
        expect(command).to.have.property('pluginType', 'user')
        expect(command).to.have.property('pluginAlias', '@My/plugina')
      },
    )
  })

  describe('theme', () => {
    testConfig({pjson, env: {FOO_DISABLE_THEME: 'true'}}, {bin: '#FF0000'}).it(
      'should not be set when DISABLE_THEME is true and theme.json exists',
      (config) => {
        expect(config).to.have.property('theme', undefined)
      },
    )

    testConfig({pjson, env: {FOO_DISABLE_THEME: 'false'}}, {bin: '#FF0000'}).it(
      'should be set when DISABLE_THEME is false and theme.json exists',
      (config) => {
        expect(config.theme).to.have.property('bin', '#FF0000')
      },
    )

    testConfig({pjson, env: {}}, {bin: '#FF0000'}).it(
      'should be set when DISABLE_THEME is unset and theme.json exists',
      (config) => {
        expect(config.theme).to.have.property('bin', '#FF0000')
      },
    )

    testConfig({pjson, env: {FOO_DISABLE_THEME: 'true'}}).it(
      'should not be set when DISABLE_THEME is true and theme.json does not exist',
      (config) => {
        expect(config).to.have.property('theme', undefined)
      },
    )

    testConfig({pjson, env: {FOO_DISABLE_THEME: 'false'}}).it(
      'should not be set when DISABLE_THEME is false and theme.json does not exist',
      (config) => {
        expect(config).to.have.property('theme', undefined)
      },
    )

    testConfig({pjson, env: {}}).it(
      'should not be set when DISABLE_THEME is unset and theme.json does not exist',
      (config) => {
        expect(config).to.have.property('theme', undefined)
      },
    )
  })
})
