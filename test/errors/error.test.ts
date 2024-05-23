import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import {error} from '../../src/errors'
import {PrettyPrintableError} from '../../src/interfaces/errors'

function isPrettyPrintableError(error: any): error is PrettyPrintableError {
  return error.code !== undefined && error.ref !== undefined && error.suggestions !== undefined
}

describe('error', () => {
  it('throws an error using a string argument', () => {
    expect(() => {
      error('An error happened!')
    }).to.throw('An error happened!')
  })

  it('attaches pretty print properties to a new error from options', () => {
    try {
      error('An error happened!', {code: 'ERR', ref: 'https://oclif.com/error', suggestions: ['rm -rf node_modules']})
    } catch (error) {
      if (isPrettyPrintableError(error)) {
        expect(error.message).to.equal('An error happened!')
        expect(error.code).to.equal('ERR')
        expect(error.ref).to.equal('https://oclif.com/error')
        expect(error.suggestions).to.deep.equal(['rm -rf node_modules'])
      } else {
        throw new Error('error is not a PrettyPrintableError')
      }
    }
  })

  it('attached pretty print properties from options to an existing error object', () => {
    try {
      error(new Error('An existing error object error!'), {
        code: 'ERR',
        ref: 'https://oclif.com/error',
        suggestions: ['rm -rf node_modules'],
      })
    } catch (error) {
      if (isPrettyPrintableError(error)) {
        expect(error.message).to.equal('An existing error object error!')
        expect(error.code).to.equal('ERR')
        expect(error.ref).to.equal('https://oclif.com/error')
        expect(error.suggestions).to.deep.equal(['rm -rf node_modules'])
      } else {
        throw new Error('error is not a PrettyPrintableError')
      }
    }
  })

  it('preserves original pretty printable properties and is not overwritten by options', () => {
    const e: any = new Error('An existing error object error!')
    e.code = 'ORIG_ERR'
    e.ref = 'ORIG_REF'
    e.suggestions = ['ORIG_SUGGESTION']

    try {
      error(e, {code: 'ERR', ref: 'https://oclif.com/error', suggestions: ['rm -rf node_modules']})
    } catch (error) {
      if (isPrettyPrintableError(error)) {
        expect(error.code).to.equal('ORIG_ERR')
        expect(error.ref).to.equal('ORIG_REF')
        expect(error.suggestions).to.deep.equal(['ORIG_SUGGESTION'])
      } else {
        throw new Error('error is not a PrettyPrintableError')
      }
    }
  })

  it('does not rethrow error when exit: false option is set', async () => {
    const {stdout, stderr} = await captureOutput(async () =>
      error('an error is reported but is not rethrown', {exit: false}),
    )
    expect(stderr).to.contain('Error: an error is reported but is not rethrown')
    expect(stdout).to.be.empty
  })

  describe('applying oclif errors', () => {
    it('adds oclif exit code to errors by default', async () => {
      const {error: err} = await captureOutput(async () => error(new Error('An existing error object error!')))
      expect(err?.oclif?.exit).to.equal(2)
    })

    it('applies the exit property on options to the error object', async () => {
      const {error: err} = await captureOutput(async () =>
        error(new Error('An existing error object error!'), {exit: 9001}),
      )
      expect(err?.oclif?.exit).to.equal(9001)
    })

    it('preserves original oclif exitable error properties and is not overwritten by options', async () => {
      const {error: err} = await captureOutput(async () => {
        const e: any = new Error('An existing error object error!')
        e.oclif = {
          code: 'ORIG_EXIT_CODE',
        }

        error(e)
      })

      // @ts-expect-error because we intentionally added a property that doesn't exist on Error
      expect(err?.oclif?.code).to.equal('ORIG_EXIT_CODE')
    })
  })
})
