import {Command} from '../../src'
import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.oclif.columns = 80
import {Help} from '../../src/help'
import {AppsDestroy, AppsCreate} from './fixtures/fixtures'

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatCommands(commands: Command.Class[]) {
    return super.formatCommands(commands)
  }
}

const formatCommands = (commands: Command.Class[]) => ({
  run(ctx: {help: TestHelp; output: string}) {
    const help = ctx.help.formatCommands(commands)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }

    ctx.output = stripAnsi(help).split('\n').map(s => s.trimEnd()).join('\n')
  },
})

const test = base
.loadConfig()
.add('help', ctx => new TestHelp(ctx.config as any))
.register('formatCommands', formatCommands)

describe('formatCommand', () => {
  test
  .formatCommands([])
  .it('outputs an empty string when no commands are given', (ctx: any) => expect(ctx.output).to.equal(''))

  test
  // @ts-ignore
  .formatCommands([AppsDestroy, AppsCreate])
  .it('shows a list of the provided commands', (ctx: any) => expect(ctx.output).to.equal(`COMMANDS
  apps:destroy  Destroy an app
  apps:create   Create an app`))

  test
  // @ts-ignore
  .formatCommands([class extends Command {
    static id = 'hello:world'

    static description = 'This is a very long command description that should wrap after too many characters have been entered'

    async run() {
      'run'
    }
  }])
  .it('handles wraps long descriptions', (ctx: any) => expect(ctx.output).to.equal(`COMMANDS
  hello:world  This is a very long command description that should wrap after
               too many characters have been entered`))
})
