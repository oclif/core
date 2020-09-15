import {expect, fancy as base, FancyTypes} from 'fancy-test'

import {Interfaces} from '../../src/config'

export const fancy = base
.register('resetConfig', () => ({
  run(ctx: {config: Interfaces.Config}) {
    delete ctx.config
  },
}))

export {
  expect,
  FancyTypes,
}
