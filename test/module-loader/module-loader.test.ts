import * as path from 'path'

import {assert, expect} from 'chai'

import {Config} from '../../src'
import ModuleLoader from '../../src/module-loader'
import {ModuleLoadError} from '../../src/errors'

const data = {
  errors: [
    {
      path: './test/module-loader/fixtures/esm/errors/bad_path.js',
      error: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] import() failed to load ${path.resolve('./test/module-loader/fixtures/esm/errors/bad_path.js')}`,
      isESM: true,
    },
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_path.cjs',
      error: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] require failed to load ${path.resolve('./test/module-loader/fixtures/cjs/errors/bad_path.cjs')}`,
      isESM: false,
    },

    {
      path: './test/module-loader/fixtures/esm/errors/bad_reference.js',
      error: ReferenceError,
      message: 'bad_reference is not defined',
      isESM: true,
    },
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_reference.cjs',
      error: ReferenceError,
      message: 'bad_reference is not defined',
      isESM: false,
    },
  ],

  modules: [
    {
      path: './test/module-loader/fixtures/esm/success.js',
      defaultModule: '{"default":"SUCCESS","namedExport":"SUCCESS_NAMED"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/esm/success.js')}`,
      isESM: true,
    },
    {
      path: './test/module-loader/fixtures/success.mjs',
      defaultModule: '{"default":"SUCCESS_MJS","namedExport":"SUCCESS_NAMED_MJS"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/success.mjs')}`,
      isESM: true,
    },

    {
      path: './test/module-loader/fixtures/cjs/success.js',
      defaultModule: '["SUCCESS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/cjs/success.js')}`,
      isESM: false,
    },
    {
      path: './test/module-loader/fixtures/success.cjs',
      defaultModule: '["SUCCESS_CJS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/success.cjs')}`,
      isESM: false,
    },
    {
      path: 'eslint',
      isESM: false,
    },
  ],
}

describe('ModuleLoader:', () => {
  describe('load:', () => {
    for (const module of data.modules) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        const result = await ModuleLoader.loadWithData(module.isESM ? configESM : config, module.path)

        // Test that the default module as a string.
        if (module.defaultModule) {
          assert.strictEqual(module.defaultModule, JSON.stringify(result.module))
        }
      })
    }
  })

  describe('loadWithData:', () => {
    for (const module of data.modules) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        const result = await ModuleLoader.loadWithData(module.isESM ? configESM : config, module.path)

        // Test that the default module as a string.
        if (module.defaultModule) {
          assert.strictEqual(module.defaultModule, JSON.stringify(result.module))
        }

        if (module.filePath) {
          assert.strictEqual(module.filePath, result.filePath)
        }

        assert.strictEqual(result.isESM, module.isESM)
      })
    }
  })

  describe('isPathModule:', () => {
    for (const module of data.modules) {
      it(`${module.path}`,  () => {
        const result = ModuleLoader.isPathModule(module.path)

        assert.strictEqual(result, module.isESM)
      })
    }
  })
})

describe('ModuleLoader Failures:', () => {
  describe('load:', () => {
    for (const module of data.errors) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        await expect(ModuleLoader.load(
          module.isESM ? configESM : config,
          module.path)).to.eventually.be.rejectedWith(module.message).and.be.an.instanceOf(module.error)
      })
    }
  })

  describe('loadWithData:', () => {
    for (const module of data.errors) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        await expect(ModuleLoader.loadWithData(
          module.isESM ? configESM : config,
          module.path)).to.eventually.be.rejectedWith(module.message).and.be.an.instanceOf(module.error)
      })
    }
  })
})
