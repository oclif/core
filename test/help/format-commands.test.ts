import {expect} from 'chai'

import {Command} from '../../src/command'

const g: any = globalThis
g.oclif.columns = 80
import {Config} from '../../src'
import {Help} from '../../src/help'
import {AppsCreate, AppsDestroy, LongDescription} from './fixtures/fixtures'
import {makeLoadable} from './help-test-utils'

// extensions to expose method as public for testing
class TestHelp extends Help {
  constructor(public config: Config) {
    super(config, {stripAnsi: true})
  }

  public formatCommands(commands: Command.Loadable[]) {
    return super.formatCommands(commands)
  }
}

describe('formatCommand', () => {
  let config: Config
  let help: TestHelp

  before(async () => {
    config = await Config.load(process.cwd())
  })

  beforeEach(() => {
    help = new TestHelp(config)
  })

  it('should output an empty string when no commands are given', async () => {
    const output = help.formatCommands([])
    expect(output).to.equal('')
  })

  it('should show a list of the provided commands', async () => {
    const output = help.formatCommands([await makeLoadable(AppsDestroy), await makeLoadable(AppsCreate)])

    expect(output).to.equal(`COMMANDS
  apps:destroy  Destroy an app
  apps:create   Create an app`)
  })

  it('should handle wraps on long descriptions', async () => {
    const output = help.formatCommands([await makeLoadable(LongDescription)])

    expect(output).to.equal(`COMMANDS
  hello:world  This is a very long command description that should wrap after
               too many characters have been entered`)
  })
})
