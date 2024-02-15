import {Hook, ux} from '../../../../../../src/index'

const hook: Hook<'init'> = async function (opts) {
  ux.log(`example hook running ${opts.id}`)
}

export default hook
