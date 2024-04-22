import {Hook, ux} from '../../../../../../src/index'

const hook: Hook.Init = async function (opts) {
  ux.stdout(`example hook running ${opts.id}`)
}

export default hook
