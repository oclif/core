import {Command} from '@oclif/command'
import * as Config from '@oclif/config'
import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.columns = 80
import Help from '../src'
import {AppsDestroy, AppsCreate} from './helpers/fixtures'

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatCommands(commands: Config.Command[]) {
    return super.formatCommands(commands)
  }
}

const test = base
.loadConfig()
.add('help', ctx => new TestHelp(ctx.config))
.register('formatCommands', (commands: Config.Command[] = []) => ({
  run(ctx: {help: TestHelp; output: string}) {
    const help = ctx.help.formatCommands(commands)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }

    ctx.output = stripAnsi(help).split('\n').map(s => s.trimRight()).join('\n')
  },
}))

describe('formatCommand', () => {
  test
  .formatCommands([])
  .it('outputs an empty string when no commands are given', (ctx: any) => expect(ctx.output).to.equal(''))

  test
  .formatCommands([AppsDestroy, AppsCreate])
  .it('shows a list of the provided commands', (ctx: any) => expect(ctx.output).to.equal(`COMMANDS
  apps:destroy  Destroy an app
  apps:create   Create an app`))

  test
  .formatCommands([class extends Command {
    static id = 'hello:world'

    static description = 'This is a very long command description that should wrap after too many characters have been entered'

    static flags = {}

    static args = []

    async run() {
      'run'
    }
  }])
  .it('handles wraps long descriptions', (ctx: any) => expect(ctx.output).to.equal(`COMMANDS
  hello:world  This is a very long command description that should wrap after
               too many characters have been entered`))
})
