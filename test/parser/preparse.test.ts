import {expect} from 'chai'
import fs from 'node:fs/promises'
import {join, resolve} from 'node:path'
import {SinonSandbox, createSandbox, match} from 'sinon'

import {Config, Interfaces} from '../../src'
import Test from './fixtures/preparse-plugin/src/commands/test'

type TestReturnType = {
  args: Interfaces.InferredArgs<typeof Test.args>
  flags: Interfaces.InferredFlags<typeof Test.flags>
}

describe('preparse hook', () => {
  let sandbox: SinonSandbox
  let config: Config

  beforeEach(async () => {
    sandbox = createSandbox()
    config = await Config.load(resolve(__dirname, join('fixtures', 'preparse-plugin')))
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('implement groupAliases', () => {
    it('should add flags that belong to alias group', async () => {
      const {flags} = await config.runCommand<TestReturnType>('test', ['--combo'])
      expect(flags).to.deep.equal({
        burger: 'double',
        combo: true,
        fries: true,
        shake: 'strawberry',
        sauce: ['ketchup'],
      })
    })

    it('should add flags that belong to alias group when using short char', async () => {
      const {flags} = await config.runCommand<TestReturnType>('test', ['-c'])
      expect(flags).to.deep.equal({
        burger: 'double',
        combo: true,
        fries: true,
        shake: 'strawberry',
        sauce: ['ketchup'],
      })
    })

    it('should add flags that belong to alias group and allow flag overrides', async () => {
      const {flags} = await config.runCommand<TestReturnType>('test', ['--combo', '--shake', 'vanilla'])
      expect(flags).to.deep.equal({
        burger: 'double',
        combo: true,
        fries: true,
        shake: 'vanilla',
        sauce: ['ketchup'],
      })
    })

    it('should add flags that belong to alias group and allow short char flag overrides', async () => {
      const {flags} = await config.runCommand<TestReturnType>('test', ['--combo', '-s', 'vanilla'])
      expect(flags).to.deep.equal({
        burger: 'double',
        combo: true,
        fries: true,
        shake: 'vanilla',
        sauce: ['ketchup'],
      })
    })
  })

  describe('implement --flags-dir', () => {
    const flagsDir = resolve(__dirname, 'fixtures', 'flags')

    function makeStubs(files: Array<{name: string; content: string}>) {
      // @ts-expect-error because sinon wants it to be a Dirent[] but node returns string[]
      sandbox.stub(fs, 'readdir').resolves(files.map(({name}) => name))

      for (const {name, content} of files) {
        sandbox.stub(fs, 'readFile').withArgs(match(name)).resolves(content)
      }
    }

    describe('boolean flags', () => {
      it('should add boolean from directory', async () => {
        makeStubs([{name: 'fries', content: ''}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir])
        expect(flags).to.deep.equal({
          burger: 'double',
          fries: true,
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })

      it('should add boolean from directory and allow flag overrides', async () => {
        makeStubs([{name: 'fries', content: ''}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir, '--no-fries'])
        expect(flags).to.deep.equal({
          burger: 'double',
          fries: false,
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })

      it('should add boolean from directory and allow short char flag overrides', async () => {
        makeStubs([{name: 'fries', content: 'false'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir, '-f'])
        expect(flags).to.deep.equal({
          burger: 'double',
          fries: true,
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })
    })

    describe('string flags', () => {
      it('should add string from directory', async () => {
        makeStubs([{name: 'shake', content: 'vanilla'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir])
        expect(flags).to.deep.equal({
          burger: 'double',
          shake: 'vanilla',
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })

      it('should add string from directory to override default', async () => {
        makeStubs([{name: 'burger', content: 'single'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir])
        expect(flags).to.deep.equal({
          burger: 'single',
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })

      it('should add string from directory and allow flag overrides', async () => {
        makeStubs([{name: 'shake', content: 'vanilla'}])
        const {flags} = await config.runCommand<TestReturnType>('test', [
          '--flags-dir',
          flagsDir,
          '--shake',
          'chocolate',
        ])
        expect(flags).to.deep.equal({
          burger: 'double',
          shake: 'chocolate',
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })

      it('should add string from directory and allow short char flag overrides', async () => {
        makeStubs([{name: 'shake', content: 'vanilla'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir, '-s', 'chocolate'])
        expect(flags).to.deep.equal({
          burger: 'double',
          shake: 'chocolate',
          'flags-dir': flagsDir,
          sauce: ['ketchup'],
        })
      })
    })

    describe('multiple flags', () => {
      it('should combine values from directory with values from argv', async () => {
        makeStubs([{name: 'sauce', content: 'bbq'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir, '--sauce', 'mustard'])
        expect(flags).to.deep.equal({
          burger: 'double',
          sauce: ['mustard', 'bbq'],
          'flags-dir': flagsDir,
        })
      })

      it('should add multiple from directory', async () => {
        makeStubs([{name: 'sauce', content: 'ketchup\nmustard\nbbq'}])
        const {flags} = await config.runCommand<TestReturnType>('test', ['--flags-dir', flagsDir, '--sauce', 'mayo'])
        expect(flags).to.deep.equal({
          burger: 'double',
          sauce: ['mayo', 'ketchup', 'mustard', 'bbq'],
          'flags-dir': flagsDir,
        })
      })
    })
  })
})
