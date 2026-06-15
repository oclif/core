import {expect} from 'chai'
import {userInfo as osUserInfo} from 'node:os'
import {sep} from 'node:path'

import {Config} from '../../src'

const getShell = () =>
  osUserInfo().shell?.split(sep)?.pop() ||
  // When you use yarn or npx or whatever to run the tests on Windows, it will use the system's default shell, which
  // derived from COMSPEC and is almost always 'cmd.exe'
  (process.platform === 'win32' ? 'cmd.exe' : 'unknown')

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
    expect(config.shell).to.equal(getShell(), `SHELL: ${process.env.SHELL} COMSPEC: ${process.env.COMSPEC}`)
  })
})
