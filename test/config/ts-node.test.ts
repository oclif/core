import {join, resolve} from 'node:path'
import * as fs from 'node:fs'
import * as tsNode from 'ts-node'
import {SinonSandbox, createSandbox} from 'sinon'

import {Interfaces, settings} from '../../src'
import * as configTsNode from '../../src/config/ts-node'
import {expect} from 'chai'

const root = resolve(__dirname, 'fixtures/typescript')
const tsSource = 'src/hooks/init.ts'
// ts-node can load the file as a module (without ts)
const tsModule = 'src/hooks/init'
const jsCompiledModule = 'lib/hooks/init'
const jsCompiled = 'lib/hooks/init.js'

// Typical root and out options of a typescript project
const DEFAULT_TS_CONFIG: Interfaces.TSConfig = {
  compilerOptions: {
    rootDir: 'src',
    outDir: 'lib',
  },
}

describe('tsPath', () => {
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    sandbox.stub(fs, 'existsSync').returns(true)
    sandbox.stub(tsNode, 'register')
  })

  afterEach(() => {
    sandbox.restore()
    // Clear caches so that unit tests don't affect each other
    // @ts-expect-error because TS_CONFIGS is not exported
    configTsNode.TS_CONFIGS = {}
    // @ts-expect-error because REGISTERED is not exported
    configTsNode.REGISTERED = new Set()
  })

  it('should resolve a .js file to ts src', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a module file to ts src', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = configTsNode.tsPath(root, jsCompiledModule)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a .ts file', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve .js with no rootDir or outDir', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({compilerOptions: {}}))
    const result = configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))
  })

  it('should resolve to .ts file if enabled and prod', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(DEFAULT_TS_CONFIG))
    settings.tsnodeEnabled = true
    const originalNodeEnv = process.env.NODE_ENV
    delete process.env.NODE_ENV

    const result = configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))

    process.env.NODE_ENV = originalNodeEnv
    delete settings.tsnodeEnabled
  })

  it('should resolve to js if disabled', () => {
    sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(DEFAULT_TS_CONFIG))
    settings.tsnodeEnabled = false
    const result = configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))

    delete settings.tsnodeEnabled
  })
})
