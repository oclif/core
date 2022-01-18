import {expect, fancy} from 'fancy-test'

import {CliUx} from '../../../src/cli-ux'

describe('styled/tree', () => {
  fancy
  .stdout()
  .end('shows the tree', output => {
    const tree = CliUx.cli.tree()
    tree.insert('foo')
    tree.insert('bar')

    const subtree = CliUx.cli.tree()
    subtree.insert('qux')
    tree.nodes.bar.insert('baz', subtree)

    tree.display()
    expect(output.stdout).to.equal(`├─ foo
└─ bar
   └─ baz
      └─ qux
`)
  })
})
