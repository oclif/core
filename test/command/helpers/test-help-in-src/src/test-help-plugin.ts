import {spy, SinonSpy} from 'sinon'
import {Interfaces, HelpBase} from '../../../../../src'

export type TestHelpClassConfig = Interfaces.Config & { showCommandHelpSpy?: SinonSpy; showHelpSpy?: SinonSpy }

export default class extends HelpBase {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(config: any, opts: any) {
    super(config, opts)
    config.showCommandHelpSpy = this.showCommandHelp
    config.showHelpSpy = this.showHelp
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  showCommandHelp = spy(async () => {
    console.log('hello from test-help-plugin #showCommandHelp')
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  showHelp = spy(async () => {
    console.log('hello showHelp')
  })

  getCommandHelpForReadme(): string {
    throw new Error('not needed for testing @oclif/command')
  }
}
