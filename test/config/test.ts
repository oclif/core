import {expect, fancy as base, FancyTypes} from 'fancy-test'

import {Interfaces} from '../../src'

export const fancy = base
.register('resetConfig', () => ({
  run(ctx: {config: Interfaces.Config}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    delete ctx.config
  },
}))

export {
  expect,
  FancyTypes,
}
