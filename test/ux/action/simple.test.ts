import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import SimpleSpinner from '../../../src/ux/action/simple'

describe('SimpleSpinner', () => {
  it('should start', async () => {
    let wasSetToActive = false
    const {stderr} = await captureOutput(async () => {
      const spinner = new SimpleSpinner()
      spinner.start('Testing a simple spinner')
      wasSetToActive = spinner.running
      spinner.stop()
    })

    expect(stderr).to.equal('Testing a simple spinner... done\n')
    expect(wasSetToActive).to.be.true
  })

  it('should pause', async () => {
    let wasPaused = false
    await captureOutput(async () => {
      const spinner = new SimpleSpinner()
      spinner.start('Testing a simple spinner')
      spinner.pause(() => {
        wasPaused = true
      })
      spinner.stop()
    })

    expect(wasPaused).to.be.true
  })

  it('should use stdout', async () => {
    const {stdout} = await captureOutput(async () => {
      const spinner = new SimpleSpinner()
      spinner.start('Testing a simple spinner', undefined, {stdout: true})
      spinner.stop()
    })

    expect(stdout).to.equal('Testing a simple spinner... done\n')
  })
})
