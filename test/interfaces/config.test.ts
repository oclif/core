import {expect} from 'chai'

import {Config} from '../../src'
import {Options} from '../../src/interfaces'

describe('theme', () => {
  describe('config', () => {
    it('should be created with enableTheme equals to false', () => {
      const config: Config = new Config({} as Options)

      expect(config.enableTheme).to.be.false
    })
  })
})
