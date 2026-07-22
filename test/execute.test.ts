import {captureOutput} from '@oclif/test'
import {expect} from 'chai'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {execute} from '../src/execute'

describe('execute', () => {
  it('infers root from dir when loadOptions are provided', async () => {
    const dir = pathToFileURL(resolve(__dirname, 'command/fixtures/esm/package.json')).toString()
    const {error, stdout} = await captureOutput(() =>
      execute({
        args: ['--version'],
        dir,
        loadOptions: {ignoreManifest: true},
      }),
    )

    expect(error).to.be.undefined
    expect(stdout).to.include('oclif-esm/0.0.0')
  })
})
