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

    it('should handle undefined input', async () => {
      const {stdout} = await captureOutput(async () => writeStdout(undefined, 'bar'))
      expect(stdout).to.equal('bar\n')
    })

    it('should write a new line with no input', async () => {
      const {stdout} = await captureOutput(async () => writeStdout())
      expect(stdout).to.equal('\n')
    })

    it('should not lose data', async () => {
      const lines = Array.from(
        {length: 100_000},
        (_, i) =>
          `Line ${i} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer convallis fringilla sollicitudin. Nunc scelerisque neque non ipsum accumsan commodo. In et porttitor eros, ut vestibulum magna. Morbi felis diam, pharetra eu dui non, sollicitudin feugiat nisi. Aliquam cursus malesuada risus, vel luctus leo ornare sed. Morbi condimentum odio id ex facilisis bibendum. Nullam consectetur consectetur viverra. Donec nec ante dui. Integer lacinia facilisis urna vitae feugiat.`,
      )

      const {stdout} = await captureOutput(async () => {
        for (const line of lines) {
          writeStdout(line)
        }
      })

      expect(stdout).to.equal(lines.join('\n') + '\n')
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

    it('should handle undefined input', async () => {
      const {stderr} = await captureOutput(async () => writeStderr(undefined, 'bar'))
      expect(stderr).to.equal('bar\n')
    })

    it('should write a new line with no input', async () => {
      const {stderr} = await captureOutput(async () => writeStderr())
      expect(stderr).to.equal('\n')
    })

    it('should not lose data', async () => {
      const lines = Array.from(
        {length: 100_000},
        (_, i) =>
          `Line ${i} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer convallis fringilla sollicitudin. Nunc scelerisque neque non ipsum accumsan commodo. In et porttitor eros, ut vestibulum magna. Morbi felis diam, pharetra eu dui non, sollicitudin feugiat nisi. Aliquam cursus malesuada risus, vel luctus leo ornare sed. Morbi condimentum odio id ex facilisis bibendum. Nullam consectetur consectetur viverra. Donec nec ante dui. Integer lacinia facilisis urna vitae feugiat.`,
      )

      const {stderr} = await captureOutput(async () => {
        for (const line of lines) {
          writeStderr(line)
        }
      })

      expect(stderr).to.equal(lines.join('\n') + '\n')
    })
  })
})
