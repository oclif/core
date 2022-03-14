import * as os from 'os'
import * as path from 'path'

import {Config} from '../../src/config/config'
import {Plugin as IPlugin} from '../../src/interfaces'
import * as util from '../../src/config/util'
import {Command as ICommand} from '../../src/interfaces'

import {expect, fancy} from './test'
import {Interfaces} from '../../src'

interface Options {
  pjson?: any;
  homedir?: string;
  platform?: string;
  env?: {[k: string]: string};
  commandIds?: string[];
  types?: string[];
}

const pjson = {
  name: 'foo',
  version: '1.0.0',
  files: [],
  commands: {},
  oclif: {
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
  const testConfig = ({pjson, homedir = '/my/home', platform = 'darwin', env = {}}: Options = {}) => {
    let test = fancy
    .resetConfig()
    .env(env, {clear: true})
    .stub(os, 'homedir', () => path.join(homedir))
    .stub(os, 'platform', () => platform)

    if (pjson) test = test.stub(util, 'loadJSON', () => Promise.resolve(pjson))

    test = test.add('config', () => Config.load())

    return {
      hasS3Key(k: keyof Interfaces.PJSON.S3.Templates, expected: string, extra: any = {}) {
        return this
        .it(`renders ${k} template as ${expected}`, config => {
          // eslint-disable-next-line prefer-const
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
        return this
        .it(`has ${k}=${v}`, config => expect(config).to.have.property(k!, v))
      },
      it(expectation: string, fn: (config: Interfaces.Config) => any) {
        test
        .do(({config}) => fn(config))
        .it(expectation)
        return this
      },
    }
  }

  describe('darwin', () => {
    testConfig()
    .hasProperty('cacheDir', path.join('/my/home/Library/Caches/@oclif/core'))
    .hasProperty('configDir', path.join('/my/home/.config/@oclif/core'))
    .hasProperty('errlog', path.join('/my/home/Library/Caches/@oclif/core/error.log'))
    .hasProperty('dataDir', path.join('/my/home/.local/share/@oclif/core'))
    .hasProperty('home', path.join('/my/home'))
  })

  describe('linux', () => {
    testConfig({platform: 'linux'})
    .hasProperty('cacheDir', path.join('/my/home/.cache/@oclif/core'))
    .hasProperty('configDir', path.join('/my/home/.config/@oclif/core'))
    .hasProperty('errlog', path.join('/my/home/.cache/@oclif/core/error.log'))
    .hasProperty('dataDir', path.join('/my/home/.local/share/@oclif/core'))
    .hasProperty('home', path.join('/my/home'))
  })

  describe('win32', () => {
    testConfig({
      platform: 'win32',
      env: {LOCALAPPDATA: '/my/home/localappdata'},
    })
    .hasProperty('cacheDir', path.join('/my/home/localappdata/@oclif\\core'))
    .hasProperty('configDir', path.join('/my/home/localappdata/@oclif\\core'))
    .hasProperty('errlog', path.join('/my/home/localappdata/@oclif\\core/error.log'))
    .hasProperty('dataDir', path.join('/my/home/localappdata/@oclif\\core'))
    .hasProperty('home', path.join('/my/home'))
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
    .hasS3Key('versioned', 'channels/beta/oclif-cli-v2.0.0-beta/oclif-cli-v2.0.0-beta-darwin-x64.tar.gz', {...beta, ...target})
  })

  describe('options', () => {
    it('should set the channel and version', async () => {
      const config = new Config({root: process.cwd(), channel: 'test-channel', version: '0.1.2-test'})
      await config.load()
      expect(config).to.have.property('channel', 'test-channel')
      expect(config).to.have.property('version', '0.1.2-test')
    })
  })

  testConfig()
  .it('has s3Url', config => {
    const orig = config.pjson.oclif.update.s3.host
    config.pjson.oclif.update.s3.host = 'https://bar.com/a/'
    expect(config.s3Url('/b/c')).to.equal('https://bar.com/a/b/c')
    config.pjson.oclif.update.s3.host = orig
  })

  testConfig({
    pjson,
  })
  .it('has subtopics', config => {
    expect(config.topics.map(t => t.name)).to.have.members(['t1', 't1:t1-1', 't1:t1-1:t1-1-1', 't1:t1-1:t1-1-2'])
  })

  describe('findCommand', () => {
    const findCommandTestConfig = ({pjson,
      homedir = '/my/home',
      platform = 'darwin',
      env = {},
      commandIds = ['foo:bar', 'foo:baz'],
      types = [],
    }: Options = {}) => {
    // @ts-ignore
      class MyComandClass implements ICommand.Class {
      _base = ''

      aliases: string[] = []

      hidden = false

      id = 'foo:bar'

      new(): ICommand.Instance {
        return {_run(): Promise<any> {
          return Promise.resolve()
        }}
      }

      run(): PromiseLike<any> {
        return Promise.resolve()
      }
      }
      const load = async (): Promise<void> => {}
      const findCommand = async (): Promise<ICommand.Class> => {
      // @ts-ignore
        return new MyComandClass()
      }

      const commandPluginA: ICommand.Plugin = {
        strict: false,
        aliases: [], args: [], flags: {}, hidden: false, id: commandIds[0], async load(): Promise<ICommand.Class> {
          return new MyComandClass() as unknown as ICommand.Class
        },
        pluginType: types[0] ?? 'core',
        pluginAlias: '@My/plugina',
      }
      const commandPluginB: ICommand.Plugin = {
        strict: false,
        aliases: [], args: [], flags: {}, hidden: false, id: commandIds[1], async load(): Promise<ICommand.Class> {
          return new MyComandClass() as unknown as ICommand.Class
        },
        pluginType: types[1] ?? 'core',
        pluginAlias: '@My/pluginb',
      }
      const hooks = {}
      const pluginA: IPlugin = {load,
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
      }
      const plugins: IPlugin[] = [pluginA, pluginB]
      let test = fancy
      .resetConfig()
      .env(env, {clear: true})
      .stub(os, 'homedir', () => path.join(homedir))
      .stub(os, 'platform', () => platform)

      if (pjson) test = test.stub(util, 'loadJSON', () => Promise.resolve(pjson))
      test = test.add('config', async () => {
        const config = await Config.load()
        config.plugins = plugins
        config.pjson.oclif.plugins = ['@My/pluginb', '@My/plugina']
        config.pjson.dependencies = {'@My/pluginb': '0.0.0', '@My/plugina': '0.0.0'}
        for (const plugin of config.plugins) {
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
          test
          .do(({config}) => fn(config))
          .it(expectation)
          return this
        },
      }
    }

    findCommandTestConfig()
    .it('find command with no duplicates', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar']})
    .it('find command with duplicates and choose the one that appears first in oclif.plugins', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('pluginAlias', '@My/pluginb')
    })
    findCommandTestConfig({types: ['core', 'user']})
    .it('find command with no duplicates core/user', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({types: ['user', 'core']})
    .it('find command with no duplicates user/core', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'user')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['core', 'user']})
    .it('find command with duplicates core/user', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'core']})
    .it('find command with duplicates user/core', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'core')
      expect(command).to.have.property('pluginAlias', '@My/pluginb')
    })
    findCommandTestConfig({commandIds: ['foo:bar', 'foo:bar'], types: ['user', 'user']})
    .it('find command with duplicates user/user', config => {
      const command = config.findCommand('foo:bar', {must: true})
      expect(command).to.have.property('id', 'foo:bar')
      expect(command).to.have.property('pluginType', 'user')
      expect(command).to.have.property('pluginAlias', '@My/plugina')
    })
  })
})
