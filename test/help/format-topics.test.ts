import * as Config from '@oclif/config'
import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.columns = 80
import Help from '../src'

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatTopics(topics: Config.Topic[]) {
    return super.formatTopics(topics)
  }
}

const test = base
.loadConfig()
.add('help', ctx => new TestHelp(ctx.config))
.register('topicsHelp', (topics: Config.Topic[]) => ({
  run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const topicsHelpOutput = ctx.help.formatTopics(topics) || ''

    if (process.env.TEST_OUTPUT === '1') {
      console.log(topicsHelpOutput)
    }

    ctx.commandHelp = stripAnsi(topicsHelpOutput).split('\n').map(s => s.trimRight()).join('\n')
    ctx.expectation = 'has topicsHelp'
  },
}))

describe('formatTopics', () => {
  test
  .topicsHelp([{
    name: 'topic',
    description: 'this is a description of my topic',
  }])
  .it('shows ouputs a single topic in the list', ctx => expect(ctx.commandHelp).to.equal(`TOPICS
  topic  this is a description of my topic`))

  test
  .topicsHelp([{
    name: 'topic',
    description: 'this is a description of my topic',
  }, {
    name: 'othertopic',
    description: 'here we have a description for othertopic',
  }, {
    name: 'thirdtopic',
    description: 'description for thirdtopic',
  }])
  .it('shows ouputs for multiple topics in the list', ctx => expect(ctx.commandHelp).to.equal(`TOPICS
  topic       this is a description of my topic
  othertopic  here we have a description for othertopic
  thirdtopic  description for thirdtopic`))
})
