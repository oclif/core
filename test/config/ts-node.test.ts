import {expect} from 'chai'
import fs from 'node:fs/promises'
import {join, resolve} from 'node:path'
import {SinonSandbox, createSandbox} from 'sinon'
import * as tsNode from 'ts-node'

import * as configTsNode from '../../src/config/ts-node'
import {Interfaces, settings} from '../../src/index'

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
    sandbox.stub(tsNode, 'register')
  })

  afterEach(() => {
    sandbox.restore()
    // Clear caches so that unit tests don't affect each other
    // @ts-expect-error because TS_CONFIGS is not exported
    // eslint-disable-next-line import/namespace
    configTsNode.TS_CONFIGS = {}
    // @ts-expect-error because REGISTERED is not exported
    // eslint-disable-next-line import/namespace
    configTsNode.REGISTERED = new Set()
  })

  it('should resolve a .js file to ts src', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a module file to ts src', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = await configTsNode.tsPath(root, jsCompiledModule)
    expect(result).to.equal(join(root, tsModule))
  })

  it('should resolve a .ts file', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify(DEFAULT_TS_CONFIG))
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve a .ts file using baseUrl', async () => {
    sandbox.stub(fs, 'readFile').resolves(
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.src/',
          outDir: 'lib',
        },
      }),
    )
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve .ts with no outDir', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify({compilerOptions: {rootDir: 'src'}}))
    const result = await configTsNode.tsPath(root, tsSource)
    expect(result).to.equal(join(root, tsSource))
  })

  it('should resolve .js with no rootDir and outDir', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify({compilerOptions: {strict: true}}))
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))
  })

  it('should resolve to .ts file if enabled and prod', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify(DEFAULT_TS_CONFIG))
    settings.tsnodeEnabled = true
    const originalNodeEnv = process.env.NODE_ENV
    delete process.env.NODE_ENV

    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, tsModule))

    process.env.NODE_ENV = originalNodeEnv
    delete settings.tsnodeEnabled
  })

  it('should resolve to js if disabled', async () => {
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify(DEFAULT_TS_CONFIG))
    settings.tsnodeEnabled = false
    const result = await configTsNode.tsPath(root, jsCompiled)
    expect(result).to.equal(join(root, jsCompiled))

    delete settings.tsnodeEnabled
  })
})
