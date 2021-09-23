import * as path from 'node:path'
import * as proxyquire from 'proxyquire'
import * as tsNode from 'ts-node'

import {Interfaces, settings} from '../../src'

import {expect, fancy} from './test'

const root = path.resolve(__dirname, 'fixtures/typescript')
const tsSource = 'src/hooks/init.ts'
// ts-node can load the file as a module (without ts)
const tsModule = 'src/hooks/init'
const jsCompiledModule = 'lib/hooks/init'
const jsCompiled = 'lib/hooks/init.js'
let tsNodeRegisterCallArguments: any[] = []

// Typical root and out options of a typescript project
const DEFAULT_TS_CONFIG: Interfaces.TSConfig = {
  compilerOptions: {
    rootDir: 'src',
    outDir: 'lib',
  },
}

const withMockTsConfig = (config: Interfaces.TSConfig = DEFAULT_TS_CONFIG) => {
  const tsNodePlugin = proxyquire('../../src/config/ts-node', {fs: {
    existsSync: () => true,
    readFileSync: () => JSON.stringify(config),
  }})

  // This prints "loadInterfaces.TSConfig unstubbed" not "loadInterfaces.TSConfig proxyquire"!
  tsNodePlugin.tsPath('qwerty', 'asdf')

  return fancy
  .add('tsNodePlugin', () => tsNodePlugin)
  .stub(tsNode, 'register', ((arg: any) => {
    tsNodeRegisterCallArguments.push(arg)
  }) as unknown as () => void)
  .finally(() => {
    tsNodeRegisterCallArguments = []
  })
}

describe('tsPath', () => {
  withMockTsConfig()
  .it('should resolve a .js file to ts src', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, jsCompiled)
    expect(result).to.equal(path.join(root, tsModule))
  })

  withMockTsConfig()
  .it('should resolve a module file to ts src', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, jsCompiledModule)
    expect(result).to.equal(path.join(root, tsModule))
  })

  withMockTsConfig()
  .it('should resolve a .ts file', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, tsSource)
    expect(result).to.equal(path.join(root, tsSource))
  })

  withMockTsConfig({compilerOptions: {}})
  .it('should resolve .js with no rootDir or outDir', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, jsCompiled)
    expect(result).to.equal(path.join(root, jsCompiled))
  })

  withMockTsConfig()
  .do(() => {
    settings.tsnodeEnabled = true
    delete process.env.NODE_ENV
  })
  .finally(() => {
    delete settings.tsnodeEnabled
    process.env.NODE_ENV = 'development'
  })
  .it('should resolve to .ts file if enabled and prod', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, jsCompiled)
    expect(result).to.equal(path.join(root, tsModule))
  })

  withMockTsConfig()
  .do(() => {
    settings.tsnodeEnabled = false
  })
  .finally(() => {
    delete settings.tsnodeEnabled
  })
  .it('should resolve to js if disabled', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, jsCompiled)
    expect(result).to.equal(path.join(root, jsCompiled))
  })
})
