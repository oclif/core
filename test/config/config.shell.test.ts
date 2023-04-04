import {expect} from 'chai'
import {Config} from '../../src'
import {sep} from 'path'
import {userInfo} from 'os'

const getShell = () => userInfo().shell?.split(sep)?.pop() || 'unknown'

describe('config shell', () => {
  it('has a default shell', () => {
    const config = new Config({root: '/tmp'})
    // @ts-ignore
    expect(config._shell()).to.equal(getShell(), `SHELL: ${process.env.SHELL} COMSPEC: ${process.env.COMSPEC}`)
  })
})
