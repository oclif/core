import {expect, fancy} from 'fancy-test'

import {error} from '../../src/errors'
import {PrettyPrintableError} from '../../src/interfaces/errors'

describe('error', () => {
  fancy
    .do(() => {
      error('An error happened!')
    })
    .catch((error: PrettyPrintableError) => {
      expect(error.message).to.equal('An error happened!')
    })
    .it('throws an error using a string argument')

  fancy
    .do(() => {
      error('An error happened!', {code: 'ERR', ref: 'https://oclif.com/error', suggestions: ['rm -rf node_modules']})
    })
    .catch((error: PrettyPrintableError) => {
      expect(error.message).to.equal('An error happened!')
      expect(error.code).to.equal('ERR')
      expect(error.ref).to.equal('https://oclif.com/error')
      expect(error.suggestions).to.deep.equal(['rm -rf node_modules'])
    })
    .it('attaches pretty print properties to a new error from options')

  fancy
    .do(() => {
      error(new Error('An existing error object error!'), {
        code: 'ERR',
        ref: 'https://oclif.com/error',
        suggestions: ['rm -rf node_modules'],
      })
    })
    .catch((error: PrettyPrintableError) => {
      expect(error.message).to.equal('An existing error object error!')
      expect(error.code).to.equal('ERR')
      expect(error.ref).to.equal('https://oclif.com/error')
      expect(error.suggestions).to.deep.equal(['rm -rf node_modules'])
    })
    .it('attached pretty print properties from options to an existing error object')

  fancy
    .do(() => {
      const e: any = new Error('An existing error object error!')
      e.code = 'ORIG_ERR'
      e.ref = 'ORIG_REF'
      e.suggestions = ['ORIG_SUGGESTION']
      error(e, {code: 'ERR', ref: 'https://oclif.com/error', suggestions: ['rm -rf node_modules']})
    })
    .catch((error: PrettyPrintableError) => {
      expect(error.code).to.equal('ORIG_ERR')
      expect(error.ref).to.equal('ORIG_REF')
      expect(error.suggestions).to.deep.equal(['ORIG_SUGGESTION'])
    })
    .it('preserves original pretty printable properties and is not overwritten by options')

  fancy
    .stdout()
    .stderr()
    .do(() => {
      error('an error is reported but is not rethrown', {exit: false})
    })
    // there is no .catch here because the error is not rethrown
    // however it should be outputted
    .it('does not rethrow error when exit: false option is set', (ctx) => {
      expect(ctx.stderr).to.contain('Error: an error is reported but is not rethrown')
      expect(ctx.stdout).to.equal('')
    })

  describe('applying oclif errors', () => {
    fancy
      .do(() => {
        error(new Error('An existing error object error!'))
      })
      .catch((error: any) => {
        const defaultErrorCode = 2
        expect(error.oclif.exit).to.equal(defaultErrorCode)
      })
      .it('adds oclif exit code to errors by default')

    fancy
      .do(() => {
        error(new Error('An existing error object error!'), {exit: 9001})
      })
      .catch((error: any) => {
        expect(error.oclif.exit).to.equal(9001)
      })
      .it('applies the exit property on options to the error object')

    fancy
      .do(() => {
        const e: any = new Error('An existing error object error!')
        e.oclif = {
          code: 'ORIG_EXIT_CODE',
        }

        error(e)
      })
      .catch((error: any) => {
        expect(error.oclif.code).to.equal('ORIG_EXIT_CODE')
      })
      .it('preserves original oclif exitable error properties and is not overwritten by options')
  })
})
