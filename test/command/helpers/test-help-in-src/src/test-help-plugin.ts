import {spy, SinonSpy} from 'sinon'
import {Config, HelpBase} from '../../../../../src'

export type TestHelpClassConfig = Config.IConfig & { showCommandHelpSpy?: SinonSpy; showHelpSpy?: SinonSpy }

export default class extends HelpBase {
  constructor(config: any, opts: any) {
    super(config, opts)
    config.showCommandHelpSpy = this.showCommandHelp
    config.showHelpSpy = this.showHelp
  }

  showCommandHelp = spy(() => {
    console.log('hello from test-help-plugin #showCommandHelp')
  })

  showHelp = spy(() => {
    console.log('hello showHelp')
  })

  getCommandHelpForReadme(): string {
    throw new Error('not needed for testing @oclif/command')
  }
}
