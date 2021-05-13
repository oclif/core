import * as path from 'path'

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
    // Non-existent path
    {
      path: './test/module-loader/fixtures/cjs/errors/bad_path.cjs',
      type: ModuleLoadError,
      message: `[MODULE_NOT_FOUND] require failed to load ${path.resolve('./test/module-loader/fixtures/cjs/errors/bad_path.cjs')}`,
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
      path: './test/module-loader/fixtures/success.mjs',
      defaultModule: '{"default":"SUCCESS_MJS","namedExport":"SUCCESS_NAMED_MJS"}',
      filePath: `${path.resolve('./test/module-loader/fixtures/success.mjs')}`,
      isESM: true,
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
      path: './test/module-loader/fixtures/success.cjs',
      defaultModule: '["SUCCESS_CJS"]',
      filePath: `${path.resolve('./test/module-loader/fixtures/success.cjs')}`,
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
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        const result = await ModuleLoader.load(module.isESM ? configESM : config, module.path)

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
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        const result = await ModuleLoader.loadWithData(module.isESM ? configESM : config, module.path)

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

        // Test source type.
        assert.strictEqual(result, module.isESM)
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
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        await expect(ModuleLoader.load(
          error.isESM ? configESM : config,
          error.path)).to.eventually.be.rejectedWith(error.message).and.be.an.instanceOf(error.type)
      })
    }
  })

  describe('loadWithData:', () => {
    for (const error of data.errors) {
      it(`${error.path}`, async () => {
        const config = new Config({root: process.cwd()})
        const configESM = new Config({root: process.cwd()})

        await config.load()
        await configESM.load()

        // Must set type manually for ESM config.
        configESM.pjson.type = 'module'

        await expect(ModuleLoader.loadWithData(
          error.isESM ? configESM : config,
          error.path)).to.eventually.be.rejectedWith(error.message).and.be.an.instanceOf(error.type)
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
