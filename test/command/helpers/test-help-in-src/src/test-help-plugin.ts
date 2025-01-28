import {SinonSpy, spy} from 'sinon'

import {HelpBase, Interfaces} from '../../../../../src'

export type TestHelpClassConfig = Interfaces.Config & {showCommandHelpSpy?: SinonSpy; showHelpSpy?: SinonSpy}

export default class CustomHelp extends HelpBase {
  showCommandHelp = spy(async () => {
    console.log('hello from test-help-plugin #showCommandHelp')
  })

  showHelp = spy(async () => {
    console.log('hello showHelp')
  })

  constructor(config: any, opts: any) {
    super(config, opts)
    config.showCommandHelpSpy = this.showCommandHelp
    config.showHelpSpy = this.showHelp
  }

  getCommandHelpForReadme(): string {
    throw new Error('not needed for testing @oclif/command')
  }
}
