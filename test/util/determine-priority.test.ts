import {expect} from 'chai'

import {Plugin} from '../../src'
import {determinePriority} from '../../src/util/determine-priority'
import {makeCommandClass, makeLoadable} from '../help/help-test-utils'

async function makeCommand(id: string, pluginAlias: string, pluginType: string) {
  const plugin = new Plugin({root: 'root', name: pluginAlias})
  plugin.name = pluginAlias
  plugin.alias = pluginAlias
  plugin.type = pluginType
  return makeLoadable(makeCommandClass({id}), plugin)
}

describe('determinePriority', () => {
  it('should return the command that belongs to first core plugin in list', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'core'), await makeCommand('foo', 'plugin2', 'core')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin1')
  })

  it('should return command owned by core plugin over command owned by user plugin', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'core'), await makeCommand('foo', 'plugin2', 'user')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin1')
  })

  it('should return command owned core plugin over command owned by non-core plugin', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'user'), await makeCommand('foo', 'plugin2', 'core')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin2')
  })

  it('should return command owned by jit plugin over command owned by user plugin', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'user'), await makeCommand('foo', 'plugin2', 'jit')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin1')
  })

  it('should return command owned by user plugin over command owned by jit plugin', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'jit'), await makeCommand('foo', 'plugin2', 'user')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin2')
  })

  it('should return the first command if no core plugin is present', async () => {
    const commands = [await makeCommand('foo', 'plugin1', 'user'), await makeCommand('foo', 'plugin2', 'user')]
    const result = determinePriority(
      commands.map((c) => c.pluginName ?? 'plugin'),
      commands,
    )
    expect(result.pluginName).to.equal('plugin1')
  })
})
