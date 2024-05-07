// `loadHelpClass` tests require an oclif project for testing so
// it is re-using the setup here to be able to do a lookup for
// this sample help class file in tests, although it is not needed
// for ../help itself.

import {HelpBase} from '../../src'

export class MyHelp extends HelpBase {
  getCommandHelpForReadme(): string {
    return 'help for readme'
  }

  async showCommandHelp(): Promise<void> {
    console.log('command help')
  }

  async showHelp(): Promise<void> {
    console.log('help')
  }
}
