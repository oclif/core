import {fancy as base} from 'fancy-test'

import {Interfaces} from '../../src'

export const fancy = base
.register('resetConfig', () => ({
  run(ctx: {config: Interfaces.Config}) {
    // @ts-ignore
    delete ctx.config
  },
}))

export {FancyTypes, expect} from 'fancy-test'
