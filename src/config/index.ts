try {
  // eslint-disable-next-line node/no-missing-require
  require('fs-extra-debug')
} catch {}

export {Config, toCached} from './config'
export {Plugin} from './plugin'
export {tsPath} from './ts-node'

