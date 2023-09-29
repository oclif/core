import {test as base, expect} from '@oclif/test'

import {TestHelp, topicsHelp} from './help-test-utils'

const g: any = global
g.oclif.columns = 80

const test = base
  .loadConfig()
  .add('help', (ctx) => new TestHelp(ctx.config as any))
  .register('topicsHelp', topicsHelp)

describe('formatTopics', () => {
  test
    .topicsHelp([
      {
        name: 'topic',
        description: 'this is a description of my topic',
      },
    ])
    .it('shows ouputs a single topic in the list', (ctx) =>
      expect(ctx.commandHelp).to.equal(`TOPICS
  topic  this is a description of my topic`),
    )

  test
    .topicsHelp([
      {
        name: 'topic',
        description: 'this is a description of my topic',
      },
      {
        name: 'othertopic',
        description: 'here we have a description for othertopic',
      },
      {
        name: 'thirdtopic',
        description: 'description for thirdtopic',
      },
    ])
    .it('shows ouputs for multiple topics in the list', (ctx) =>
      expect(ctx.commandHelp).to.equal(`TOPICS
  topic       this is a description of my topic
  othertopic  here we have a description for othertopic
  thirdtopic  description for thirdtopic`),
    )
})
