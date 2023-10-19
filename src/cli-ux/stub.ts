import type {SinonSandbox, SinonStub} from 'sinon'

import write from './write'

type Stubs = {
  stderr: SinonStub
  stdout: SinonStub
}

/**
 * Create sinon stubs for writing to stdout and stderr.
 *
 * @example
 * import {ux} from '@oclif/core'
 *
 * describe('example', () => {
 *   let sandbox: SinonSandbox
 *   let stubs: ReturnType<typeof ux.makeStubs>
 *
 *   beforeEach(() => {
 *     sandbox = createSandbox()
 *     stubs = ux.makeStubs(sandbox)
 *   })
 *
 *   afterEach(() => {
 *     sandbox.restore()
 *   })
 *
 *   it('should log text to the console', () => {
 *     ux.log('Hello, world!')
 *     expect(stubs.stdout.firstCall.firstArg).to.equal('Hello, world!\n')
 *   })
 * })
 */
export function makeStubs(sandbox: SinonSandbox): Stubs {
  return {
    stderr: sandbox.stub(write, 'stderr'),
    stdout: sandbox.stub(write, 'stdout'),
  }
}
