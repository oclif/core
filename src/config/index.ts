try {
  // eslint-disable-next-line node/no-missing-require
  require('fs-extra-debug')
} catch {}

// export {IConfig, Config, Options, load, LoadOptions, PlatformTypes, ArchTypes} from './config'
export {Config, toCached} from './config'
// export {Command} from './interfaces/command'
// export {Hook, Hooks} from './interfaces/hooks'
// export {Manifest} from './interfaces/manifest'
// export {PJSON} from './interfaces/pjson'
export {Plugin} from './plugin'
// export {Topic} from './interfaces/topic'
export {tsPath} from './ts-node'

import * as Interfaces from './interfaces'
export {Interfaces}
// (a: Interfaces.HookKeyOrOptions) => {}
