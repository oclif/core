import {expect} from 'chai'
import {basename} from 'node:path'

import {readTSConfig} from '../../src/util/read-tsconfig'
import {Executor} from './util'

describe('tsconfig integration', () => {
  const executor = new Executor({
    pluginDir: 'test/integration/fixtures/tsconfig-tests',
    testFileName: basename(__filename),
  })

  before(async () => {
    await executor.executeInTestDir('yarn')
  })

  it('should read local', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-no-extends.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        'tsconfig-local-no-extends': true,
      },
      'ts-node': {
        'tsconfig-local-no-extends': true,
      },
    })
  })

  it('should read local -> local', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-extends-local.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        'tsconfig-local-extends-local': true,
        'tsconfig-local-no-extends': true,
      },
      'ts-node': {
        'tsconfig-local-extends-local': true,
        'tsconfig-local-no-extends': true,
      },
    })
  })

  it('should read local -> node_modules', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-extends-node-modules.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        forceConsistentCasingInFileNames: true,
        skipLibCheck: true,
        esModuleInterop: true,
        checkJs: true,
        isolatedModules: true,
        noUnusedParameters: true,
        noUnusedLocals: true,
        noUncheckedIndexedAccess: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
        exactOptionalPropertyTypes: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false,
        strict: true,
        'tsconfig-local-extends-node-modules': true,
      },
      'ts-node': {'tsconfig-local-extends-node-modules': true},
    })
  })

  it('should read local -> local -> node_modules', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-extends-local-extends-node-modules.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        forceConsistentCasingInFileNames: true,
        skipLibCheck: true,
        esModuleInterop: true,
        checkJs: true,
        isolatedModules: true,
        noUnusedParameters: true,
        noUnusedLocals: true,
        noUncheckedIndexedAccess: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
        exactOptionalPropertyTypes: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false,
        strict: true,
        'tsconfig-local-extends-local-extends-node-modules': true,
        'tsconfig-local-extends-node-modules': true,
      },
      'ts-node': {
        'tsconfig-local-extends-local-extends-node-modules': true,
        'tsconfig-local-extends-node-modules': true,
      },
    })
  })

  it('should read local -> node_modules -> local node_modules', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-extends-local-extends-node-modules.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        forceConsistentCasingInFileNames: true,
        skipLibCheck: true,
        esModuleInterop: true,
        checkJs: true,
        isolatedModules: true,
        noUnusedParameters: true,
        noUnusedLocals: true,
        noUncheckedIndexedAccess: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
        exactOptionalPropertyTypes: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false,
        strict: true,
        'tsconfig-local-extends-node-modules': true,
        'tsconfig-local-extends-local-extends-node-modules': true,
      },
      'ts-node': {
        'tsconfig-local-extends-node-modules': true,
        'tsconfig-local-extends-local-extends-node-modules': true,
      },
    })
  })

  it('should read local -> non-existent', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-local-extends-non-existent.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {
        'tsconfig-local-extends-non-existent': true,
      },
      'ts-node': {
        'tsconfig-local-extends-non-existent': true,
      },
    })
  })

  it('should return empty tsconfig for non-existent', async () => {
    const tsconfig = await readTSConfig(executor.pluginDir, 'tsconfig-non-existent.json')
    expect(tsconfig).to.deep.equal({
      compilerOptions: {},
      'ts-node': {},
    })
  })
})
