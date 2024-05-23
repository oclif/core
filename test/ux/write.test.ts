import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import {stderr as writeStderr, stdout as writeStdout} from '../../src/ux/write'

describe('write', () => {
  describe('stdout', () => {
    it('should write with a string', async () => {
      const {stdout} = await captureOutput(async () => writeStdout('foo'))
      expect(stdout).to.equal('foo\n')
    })

    it('should write with a string array', async () => {
      const {stdout} = await captureOutput(async () => writeStdout(['foo', 'bar']))
      expect(stdout).to.equal('foo bar\n')
    })

    it('should write with formatted string', async () => {
      const {stdout} = await captureOutput(async () => writeStdout('foo %s', 'bar'))
      expect(stdout).to.equal('foo bar\n')
    })

    it('should write with formatted string array', async () => {
      const {stdout} = await captureOutput(async () => writeStdout(['%s', 'foo'], 'bar'))
      expect(stdout).to.equal('foo bar\n')
    })

    it('should format undefined input', async () => {
      const {stdout} = await captureOutput(async () => writeStdout(undefined, 'bar'))
      expect(stdout).to.equal('undefined bar\n')
    })
  })

  describe('stderr', () => {
    it('should write with a string', async () => {
      const {stderr} = await captureOutput(async () => writeStderr('foo'))
      expect(stderr).to.equal('foo\n')
    })

    it('should write with a string array', async () => {
      const {stderr} = await captureOutput(async () => writeStderr(['foo', 'bar']))
      expect(stderr).to.equal('foo bar\n')
    })

    it('should write with formatted string', async () => {
      const {stderr} = await captureOutput(async () => writeStderr('foo %s', 'bar'))
      expect(stderr).to.equal('foo bar\n')
    })

    it('should write with formatted string array', async () => {
      const {stderr} = await captureOutput(async () => writeStderr(['%s', 'foo'], 'bar'))
      expect(stderr).to.equal('foo bar\n')
    })

    it('should format undefined input', async () => {
      const {stderr} = await captureOutput(async () => writeStderr(undefined, 'bar'))
      expect(stderr).to.equal('undefined bar\n')
    })
  })
})
