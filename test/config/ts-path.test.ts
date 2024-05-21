import {expect} from 'chai'
import {join, resolve} from 'node:path'
import sinon from 'sinon'
import * as tsNode from 'ts-node'

import * as configTsNode from '../../src/config/ts-path'
import {Interfaces, settings} from '../../src/index'
import * as util from '../../src/util/read-tsconfig'

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
  beforeEach(() => {
    sinon.stub(tsNode, 'register')
  })

  afterEach(() => {
    sinon.restore()
    // Clear caches so that unit tests don't affect each other
    // @ts-expect-error because TS_CONFIGS is not exported
    // eslint-disable-next-line import/namespace
    configTsNode.TS_CONFIGS = {}
    // @ts-expect-error because REGISTERED is not exported
    // eslint-disable-next-line import/namespace
    configTsNode.REGISTERED = new Set()
  })

  it('should resolve a .js file to ts src', async () => {
    sinon.stub(util, 'readTSConfig').resolves(DEFAULT_TS_CONFIG)
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a module file to ts src', async () => {
    sinon.stub(util, 'readTSConfig').resolves(DEFAULT_TS_CONFIG)
    const result = await configTsNode.tsPath(root, jsCompiledModule)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a .ts file', async () => {
    sinon.stub(util, 'readTSConfig').resolves(DEFAULT_TS_CONFIG)
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve a .ts file using baseUrl', async () => {
    sinon.stub(util, 'readTSConfig').resolves({
      compilerOptions: {
        baseUrl: '.src/',
        outDir: 'lib',
      },
    })
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve .ts with no outDir', async () => {
    sinon.stub(util, 'readTSConfig').resolves({compilerOptions: {rootDir: 'src'}})
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve .js with no rootDir and outDir', async () => {
    sinon.stub(util, 'readTSConfig').resolves({compilerOptions: {sourceMap: true}})
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))
  })

  it('should resolve to .ts file if enabled and prod', async () => {
    sinon.stub(util, 'readTSConfig').resolves(DEFAULT_TS_CONFIG)
    settings.enableAutoTranspile = true
    const originalNodeEnv = process.env.NODE_ENV
    delete process.env.NODE_ENV

    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))

    process.env.NODE_ENV = originalNodeEnv
    delete settings.enableAutoTranspile
  })

  it('should resolve to js if disabled', async () => {
    sinon.stub(util, 'readTSConfig').resolves(DEFAULT_TS_CONFIG)
    settings.enableAutoTranspile = false
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))

    delete settings.enableAutoTranspile
  })
})
