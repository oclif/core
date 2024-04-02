import ansis from 'ansis'
import {expect, fancy} from 'fancy-test'

import {CLIError} from '../../src/errors'
import {config} from '../../src/errors/config'
import prettyPrint from '../../src/errors/errors/pretty-print'
import {PrettyPrintableError} from '../../src/interfaces/errors'

describe('pretty-print', () => {
  fancy.it('pretty prints an error', async () => {
    const sampleError: Error & PrettyPrintableError = new Error('Something very serious has gone wrong with the flags!')
    sampleError.ref = 'https://oclif.io/docs/flags'
    sampleError.code = 'OCLIF_BAD_FLAG'
    sampleError.suggestions = ['Try using using a good flag']

    expect(ansis.strip(prettyPrint(sampleError) ?? '')).to
      .equal(`    Error: Something very serious has gone wrong with the flags!
    Code: OCLIF_BAD_FLAG
    Try this: Try using using a good flag
    Reference: https://oclif.io/docs/flags`)
  })

  fancy.it('pretty prints multiple suggestions', async () => {
    const sampleError: Error & PrettyPrintableError = new Error('Something very serious has gone wrong with the flags!')
    sampleError.suggestions = ['Use a good flag', 'Use no flags']
    expect(ansis.strip(prettyPrint(sampleError) ?? '')).to
      .equal(`    Error: Something very serious has gone wrong with the flags!
    Try this:
      * Use a good flag
      * Use no flags`)
  })

  fancy.it('pretty prints with omitted fields', async () => {
    const sampleError = new Error('Something very serious has gone wrong with the flags!')

    expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(
      '    Error: Something very serious has gone wrong with the flags!',
    )
  })

  describe('CLI Error properties', () => {
    fancy.it('supports the bang property', async () => {
      class SampleCLIError extends CLIError {
        get bang() {
          return '>>>'
        }
      }

      const sampleError = new SampleCLIError('This is a CLI error')
      expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(' >>>   Error: This is a CLI error')
    })

    fancy.it("supports the 'name' message prefix property", async () => {
      const defaultBang = process.platform === 'win32' ? '»' : '›'
      const sampleError = new CLIError('This is a CLI error')
      sampleError.name = 'Errorz'
      expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(` ${defaultBang}   Errorz: This is a CLI error`)
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

    fancy.it('shows the stack for an error', async () => {
      const error = new Error('oh no!')
      error.stack = 'this is the error stack property'
      expect(prettyPrint(error)).to.equal('this is the error stack property')
    })
  })
})
