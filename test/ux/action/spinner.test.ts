import {captureOutput} from '@oclif/test'
import {expect} from 'chai'

import Spinner from '../../../src/ux/action/spinner'

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

describe('Spinner', () => {
  it('should start', async () => {
    let wasSetToActive = false
    await captureOutput(async () => {
      const spinner = new Spinner()
      spinner.start('Testing a spinner')
      wasSetToActive = spinner.running
      spinner.stop()
    })
    expect(wasSetToActive).to.be.true
  })

  it('should pause', async () => {
    let wasPaused = false
    await captureOutput(async () => {
      const spinner = new Spinner()
      spinner.start('Testing a spinner')
      spinner.pause(() => {
        wasPaused = true
      })
      spinner.stop()
    })

    expect(wasPaused).to.be.true
  })

  it('should pauseAsync', async () => {
    let wasPaused = false
    await captureOutput(async () => {
      const spinner = new Spinner()
      spinner.start('Testing a spinner')
      spinner.pauseAsync(async () => {
        wasPaused = true
      })
      spinner.stop()
    })

    expect(wasPaused).to.be.true
  })

  it('should use stdout', async () => {
    const {stdout} = await captureOutput(async () => {
      const spinner = new Spinner()
      spinner.start('Testing a spinner', undefined, {stdout: true})
      // Have to give the spinner enough time to render the status
      await sleep(100)
      spinner.stop()
    })

    expect(stdout).to.include('Testing a spinner... done\n')
  })

  describe('status', () => {
    it('should update with status', async () => {
      const {stderr, result} = await captureOutput(async () => {
        const spinner = new Spinner()
        spinner.start('Testing a spinner')
        spinner.status = 'still testing'
        // Have to give the spinner enough time to render the status
        await sleep(100)
        const {status} = spinner
        spinner.stop()
        return status
      })

      expect(stderr).to.include('still testing\n')
      expect(result).to.equal('still testing')
    })

    it('should not do anything if not active', async () => {
      const {result} = await captureOutput(async () => {
        const spinner = new Spinner()
        spinner.status = 'still testing'
        return spinner.status
      })
      expect(result).to.be.undefined
    })
  })
})
