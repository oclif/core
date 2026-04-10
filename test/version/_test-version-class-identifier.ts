// `loadVersionClass` tests require an oclif project for testing so
// it is re-using the setup here to be able to do a lookup for
// this sample version class file in tests, although it is not needed
// for ../version itself.

import {VersionBase} from '../../src'

export class MyVersion extends VersionBase {
  async showVersion(): Promise<void> {
    console.log('custom version output from named export')
  }
}
