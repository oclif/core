import {FancyTypes, fancy as base, expect} from 'fancy-test'

import {Interfaces} from '../../src'

export const fancy = base
.register('resetConfig', () => ({
  run(ctx: {config: Interfaces.Config}) {
    // @ts-ignore
    delete ctx.config
  },
}))

export {
  expect,
  FancyTypes,
}
