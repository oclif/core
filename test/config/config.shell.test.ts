import {expect} from 'chai'
import {userInfo as osUserInfo} from 'node:os'
import {sep} from 'node:path'

import {Config} from '../../src'

const getShell = () =>
  osUserInfo().shell?.split(sep)?.pop() || (process.platform === 'win32' ? 'powershell' : 'unknown')

describe('config shell', () => {
  it('has a default shell', async () => {
    const config = new Config({
      root: '/tmp',
      pjson: {
        name: 'test-cli',
        version: '0.0.1',
        oclif: {
          bin: 'test-cli',
        },
      },
    })
    await config.load()
    // @ts-expect-error because _shell is private
    expect(config._shell()).to.equal(getShell(), `SHELL: ${process.env.SHELL} COMSPEC: ${process.env.COMSPEC}`)
  })
})
