import * as path from 'path'
import * as proxyquire from 'proxyquire'
import * as tsNode from 'ts-node'

import {Interfaces} from '../../src'

import {expect, fancy} from './test'

const root = path.resolve(__dirname, 'fixtures/typescript')
const orig = 'src/hooks/init.ts'
let tsNodeRegisterCallArguments: any[] = []

const DEFAULT_TS_CONFIG: Interfaces.TSConfig = {
  compilerOptions: {},
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
  .it('should resolve a .ts file', (ctx: any) => {
    const result = ctx.tsNodePlugin.tsPath(root, orig)
    expect(result).to.equal(path.join(root, orig))
  })

  withMockTsConfig()
  .it('should leave esModuleInterop undefined by default', (ctx: any) => {
    ctx.tsNodePlugin.tsPath(root, orig)
    expect(tsNodeRegisterCallArguments.length).is.equal(1)
    expect(tsNodeRegisterCallArguments[0])
    .to.have.nested.property('compilerOptions.esModuleInterop')
    .equal(undefined)
  })

  withMockTsConfig({
    compilerOptions: {
      esModuleInterop: true,
    },
  })
  .it('should use the provided esModuleInterop option', (ctx: any) => {
    ctx.tsNodePlugin.tsPath(root, orig)
    expect(tsNodeRegisterCallArguments.length).is.equal(1)
    expect(tsNodeRegisterCallArguments[0])
    .to.have.nested.property('compilerOptions.esModuleInterop')
    .equal(true)
  })
})
