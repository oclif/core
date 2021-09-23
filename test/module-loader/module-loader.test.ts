import * as path from 'node:path'

import {assert, expect} from 'chai'

import {Config} from '../../src'
import ModuleLoader from '../../src/module-loader'
import {ModuleLoadError} from '../../src/errors'

// The following data object contains an array of module loading data for errors and successful loading conditions and
// the associated data to test for ModuleLoader.

const data = {
  errors: [
    // Non-existent path
    {
      path: './test/module-loader/fixtures/esm/errors/bad_path.js',
      type: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] import() failed to load ${path.resolve('./test/module-loader/fixtures/esm/errors/bad_path.js')}`,
      isESM: true,
    },
    // Non-existent path / no extension
    {
      path: './test/module-loader/fixtures/esm/errors/bad_path',
      type: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] require failed to load ${path.resolve('./test/module-loader/fixtures/esm/errors/bad_path')}`,
      isESM: true,
    },

    // Non-existent path
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_path.cjs',
      type: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] require failed to load ${path.resolve('./test/module-loader/fixtures/cjs/errors/bad_path.cjs')}`,
      isESM: false,
    },
    // Non-existent path / no extension
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_path',
      type: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] require failed to load ${path.resolve('./test/module-loader/fixtures/cjs/errors/bad_path')}`,
      isESM: false,
    },

    // Incomplete source file
    {
      path: './test/module-loader/fixtures/esm/errors/bad_reference.js',
      type: ReferenceError,
      message: 'bad_reference is not defined',
      isESM: true,
    },
    // Incomplete source file
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_reference.cjs',
      type: ReferenceError,
      message: 'bad_reference is not defined',
      isESM: false,
    },
  ],

  modules: [
    // ESM source file. Loads package.json in './test/module-loader/fixtures/esm/' for getPackageType check.
    {
      path: './test/module-loader/fixtures/esm/success.js',
      defaultModule: '{"default":"SUCCESS","namedExport":"SUCCESS_NAMED"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/esm/success.js')}`,
      isESM: true,
    },
    // ESM source file loaded due to mjs file type.
    {
      path: './test/module-loader/fixtures/esm/empty-package/success-ext.mjs',
      defaultModule: '{"default":"SUCCESS_MJS","namedExport":"SUCCESS_NAMED_MJS"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/esm/empty-package/success-ext.mjs')}`,
      isESM: true,
    },
    // No extension / ESM source file. Loads package.json in './test/module-loader/fixtures/esm/' for getPackageType check.
    {
      path: './test/module-loader/fixtures/esm/success',
      defaultModule: '{"default":"SUCCESS","namedExport":"SUCCESS_NAMED"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/esm/success.js')}`,
      isESM: true,
      isESMOverride: false,  // With no extension `ModuleLoader.isPathModule` will return CJS
    },
    // No extension / ESM source file loaded due to mjs file type.
    {
      path: './test/module-loader/fixtures/esm/empty-package/success-ext',
      defaultModule: '{"default":"SUCCESS_MJS","namedExport":"SUCCESS_NAMED_MJS"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/esm/empty-package/success-ext.mjs')}`,
      isESM: true,
      isESMOverride: false,  // With no extension `ModuleLoader.isPathModule` will return CJS
    },

    // CJS source loaded from package.json in './test/module-loader/fixtures/cjs/' which doesn't have "type": "module".
    {
      path: './test/module-loader/fixtures/cjs/success.js',
      defaultModule: '["SUCCESS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/cjs/success.js')}`,
      isESM: false,
    },
    // CJS source file loaded due to cjs file type.
    {
      path: './test/module-loader/fixtures/cjs/success-ext.cjs',
      defaultModule: '["SUCCESS_CJS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/cjs/success-ext.cjs')}`,
      isESM: false,
    },
    // No extension / CJS source loaded from package.json in './test/module-loader/fixtures/cjs/' which doesn't have "type": "module".
    {
      path: './test/module-loader/fixtures/cjs/success',
      defaultModule: '["SUCCESS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/cjs/success.js')}`,
      isESM: false,
    },
    // No extension / CJS source file loaded due to cjs file type.
    {
      path: './test/module-loader/fixtures/cjs/success-ext',
      defaultModule: '["SUCCESS_CJS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/cjs/success-ext.cjs')}`,
      isESM: false,
    },

    // CJS NPM module; just check that it loads as CJS.
    {
      path: 'eslint',
      isESM: false,
    },
  ],
}

// The following tests iterate over `data.module` to validate successful loading conditions for CJS & ESM source files.
describe('ModuleLoader:', () => {
  describe('load:', () => {
    for (const module of data.modules) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        await config.load()

        const result = await ModuleLoader.load(config, module.path)

        // Test that the default module as a string.
        if (module.defaultModule) {
          assert.strictEqual(module.defaultModule, JSON.stringify(result))
        }
      })
    }
  })

  describe('loadWithData:', () => {
    for (const module of data.modules) {
      it(`${module.path}`, async () => {
        const config = new Config({root: process.cwd()})
        await config.load()

        const result = await ModuleLoader.loadWithData(config, module.path)

        // Test the exported module as a string.
        if (module.defaultModule) {
          assert.strictEqual(module.defaultModule, JSON.stringify(result.module))
        }

        // Test that the loaded filePath matches.
        if (module.filePath) {
          assert.strictEqual(module.filePath, result.filePath)
        }

        // Test source type.
        assert.strictEqual(result.isESM, module.isESM)
      })
    }
  })

  describe('isPathModule:', () => {
    for (const module of data.modules) {
      it(`${module.path}`,  () => {
        const result = ModuleLoader.isPathModule(module.path)

        // For extensionless ESM data `isPathModule` will return false
        const test = typeof module.isESMOverride === 'boolean' ? module.isESMOverride : module.isESM

        // Test source type.
        assert.strictEqual(result, test)
      })
    }
  })
})

// The following tests iterate over `data.errors` to validate common error conditions.
describe('ModuleLoader Failures:', () => {
  describe('load:', () => {
    for (const error of data.errors) {
      it(`${error.path}`, async () => {
        const config = new Config({root: process.cwd()})
        await config.load()

        await expect(ModuleLoader.load(
          config, error.path)).to.eventually.be.rejectedWith(error.message).and.be.an.instanceOf(error.type)
      })
    }
  })

  describe('loadWithData:', () => {
    for (const error of data.errors) {
      it(`${error.path}`, async () => {
        const config = new Config({root: process.cwd()})
        await config.load()

        await expect(ModuleLoader.loadWithData(
          config, error.path)).to.eventually.be.rejectedWith(error.message).and.be.an.instanceOf(error.type)
      })
    }
  })

  describe('ModuleLoadError:', () => {
    it("has code 'MODULE_NOT_FOUND'", () => {
      const error = new ModuleLoadError('MESSAGE')
      assert.strictEqual(error.code, 'MODULE_NOT_FOUND')
    })
  })
})
