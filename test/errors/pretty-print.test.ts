import {expect, fancy} from 'fancy-test'
import prettyPrint from '../../src/errors/errors/pretty-print'
import {PrettyPrintableError} from '../../src/interfaces/errors'
import {CLIError} from '../../src/errors'
import {config} from '../../src/errors/config'
const stripAnsi = require('strip-ansi')

describe('pretty-print', () => {
  fancy
  .it('pretty prints an error',  () => {
    const sampleError: Error & PrettyPrintableError = new Error('Something very serious has gone wrong with the flags!')
    sampleError.ref = 'https://oclif.io/docs/flags'
    sampleError.code = 'OCLIF_BAD_FLAG'
    sampleError.suggestions = ['Try using using a good flag']

    expect(
      stripAnsi(prettyPrint(sampleError)),
    ).to.equal(`    Error: Something very serious has gone wrong with the flags!
    Code: OCLIF_BAD_FLAG
    Try this: Try using using a good flag
    Reference: https://oclif.io/docs/flags`)
  })

  fancy
  .it('pretty prints multiple suggestions',  () => {
    const sampleError: Error & PrettyPrintableError = new Error('Something very serious has gone wrong with the flags!')
    sampleError.suggestions = ['Use a good flag', 'Use no flags']
    expect(
      stripAnsi(prettyPrint(sampleError)),
    ).to.equal(`    Error: Something very serious has gone wrong with the flags!
    Try this:
      * Use a good flag
      * Use no flags`)
  })

  fancy
  .it('pretty prints with omitted fields',  () => {
    const sampleError = new Error('Something very serious has gone wrong with the flags!')

    expect(
      stripAnsi(prettyPrint(sampleError)),
    ).to.equal('    Error: Something very serious has gone wrong with the flags!')
  })

  describe('CLI Error properties', () => {
    fancy
    .it('supports the bang property',  () => {
      class SampleCLIError extends CLIError {
        get bang() {
          return '>>>'
        }
      }

      const sampleError = new SampleCLIError('This is a CLI error')
      expect(stripAnsi(prettyPrint(sampleError))).to.equal(' >>>   Error: This is a CLI error')
    })

    fancy
    .it('supports the \'name\' message prefix property',  () => {
      const defaultBang = process.platform === 'win32' ? '»' : '›'
      const sampleError = new CLIError('This is a CLI error')
      sampleError.name = 'Errorz'
      expect(stripAnsi(prettyPrint(sampleError))).to.equal(` ${defaultBang}   Errorz: This is a CLI error`)
    })
  })

  describe('config.debug set to true', () => {
    let initialConfigDebug: any

    beforeEach(() => {
      initialConfigDebug = config.debug
      config.debug = true
    })

    afterEach(() => {
      config.debug = initialConfigDebug
    })

    fancy
    .it('shows the stack for an error',  () => {
      const error = new Error('oh no!')
      error.stack = 'this is the error stack property'
      expect(prettyPrint(error)).to.equal('this is the error stack property')
    })
  })
})
