import ansis from 'ansis'
import {expect} from 'chai'

import {settings} from '../../src'
import {CLIError} from '../../src/errors'
import prettyPrint from '../../src/errors/errors/pretty-print'
import {PrettyPrintableError} from '../../src/interfaces/errors'

describe('pretty-print', () => {
  it('pretty prints a simple error', async () => {
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

  it('pretty prints an error and its causative error chain', async () => {
    const rootError: Error & PrettyPrintableError = new Error('This error is the root error')
    const errorOnceRemoved: Error & PrettyPrintableError = new Error(
      'This error is one level removed from the root error',
      {cause: rootError},
    )
    const errorTwiceRemoved: Error & PrettyPrintableError = new Error(
      'This error is two levels removed from the root error',
      {cause: errorOnceRemoved},
    )

    expect(ansis.strip(prettyPrint(errorTwiceRemoved) ?? '')).to
      .equal(`    Error: This error is two levels removed from the root error
    Caused by: Error: This error is one level removed from the root error
    Caused by: Error: This error is the root error`)
  })

  it('pretty prints multiple suggestions', async () => {
    const sampleError: Error & PrettyPrintableError = new Error('Something very serious has gone wrong with the flags!')
    sampleError.suggestions = ['Use a good flag', 'Use no flags']
    expect(ansis.strip(prettyPrint(sampleError) ?? '')).to
      .equal(`    Error: Something very serious has gone wrong with the flags!
    Try this:
      * Use a good flag
      * Use no flags`)
  })

  it('pretty prints with omitted fields', async () => {
    const sampleError = new Error('Something very serious has gone wrong with the flags!')

    expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(
      '    Error: Something very serious has gone wrong with the flags!',
    )
  })

  describe('CLI Error properties', () => {
    it('supports the bang property', async () => {
      class SampleCLIError extends CLIError {
        get bang() {
          return '>>>'
        }
      }

      const sampleError = new SampleCLIError('This is a CLI error')
      expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(' >>>   Error: This is a CLI error')
    })

    it("supports the 'name' message prefix property", async () => {
      const defaultBang = process.platform === 'win32' ? '»' : '›'
      const sampleError = new CLIError('This is a CLI error')
      sampleError.name = 'Errorz'
      expect(ansis.strip(prettyPrint(sampleError) ?? '')).to.equal(` ${defaultBang}   Errorz: This is a CLI error`)
    })
  })

  describe('settings.debug set to true', () => {
    let initialSettingsDebug: boolean | undefined

    beforeEach(() => {
      initialSettingsDebug = settings.debug
      settings.debug = true
    })

    afterEach(() => {
      settings.debug = initialSettingsDebug
    })

    it('shows the stack for an error', async () => {
      const error = new Error('oh no!')
      error.stack = 'this is the error stack property'
      expect(prettyPrint(error)).to.equal('this is the error stack property')
    })

    it('shows the stack for causative errors', async () => {
      const rootError: Error & PrettyPrintableError = new Error('This error is the root error')
      rootError.stack = String.raw`Root error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`
      const errorOnceRemoved: Error & PrettyPrintableError = new Error(
        'This error is one level removed from the root error',
        {cause: rootError},
      )
      errorOnceRemoved.stack = String.raw`Once-removed error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`
      const errorTwiceRemoved: Error & PrettyPrintableError = new Error(
        'This error is two levels removed from the root error',
        {cause: errorOnceRemoved},
      )
      errorTwiceRemoved.stack = String.raw`Twice-removed error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`

      expect(prettyPrint(errorTwiceRemoved)).to.equal(
        "Twice-removed error stack. In the wild, this would be something like 'Error: someMessage\\n\\tcodeStack'\n" +
          "Caused by: Once-removed error stack. In the wild, this would be something like 'Error: someMessage\\n\\tcodeStack'\n" +
          String.raw`Caused by: Root error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`,
      )
    })

    it('when no stack is available, standard pretty print is used instead', () => {
      const rootError: Error & PrettyPrintableError = new Error('This error is the root error')
      rootError.stack = String.raw`Root error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`
      const errorOnceRemoved: Error & PrettyPrintableError = new Error(
        'This error is one level removed from the root error',
        {cause: rootError},
      )
      delete errorOnceRemoved.stack
      const errorTwiceRemoved: Error & PrettyPrintableError = new Error(
        'This error is two levels removed from the root error',
        {cause: errorOnceRemoved},
      )
      errorTwiceRemoved.stack = String.raw`Twice-removed error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`

      expect(prettyPrint(errorTwiceRemoved)).to.equal(
        "Twice-removed error stack. In the wild, this would be something like 'Error: someMessage\\n\\tcodeStack'\n" +
          'Caused by: Error: This error is one level removed from the root error\n' +
          String.raw`Caused by: Root error stack. In the wild, this would be something like 'Error: someMessage\n\tcodeStack'`,
      )
    })
  })
})
