import {expect} from 'chai'
import {homedir} from 'node:os'

import {getHomeDir} from '../../src/util/os'

describe('getHomeDir', () => {
  it('should return the home directory', () => {
    expect(getHomeDir()).to.equal(homedir())
  })
})
