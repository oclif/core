import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-named-as-default-member': 'off',
      'no-useless-constructor': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-union-types': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-module': 'off',
    },
  },
  {
    files: ['test/**/*'],
    rules: {
      '@stylistic/lines-between-class-members': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'max-lines': 'off',
      'mocha/max-top-level-suites': ['warn', {limit: 8}],
      'no-import-assign': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-objects': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/no-static-only-class': 'off',
      'unicorn/no-useless-undefined': 'off',
    },
  },
  {
    files: ['test/integration/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'mocha/no-nested-tests': 'off',
      'mocha/no-sibling-hooks': 'off',
      'mocha/no-top-level-hooks': 'off',
      'unicorn/prefer-object-from-entries': 'off',
      'unicorn/prefer-top-level-await': 'off',
    },
  },
  {
    files: ['test/module-loader/fixtures/**/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      camelcase: 'off',
      'no-undef': 'off',
      'unicorn/filename-case': 'off',
    },
  },
]
