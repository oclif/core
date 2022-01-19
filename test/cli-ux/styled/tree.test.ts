import {expect, fancy} from 'fancy-test'

import {CliUx} from '../../../src'

describe('styled/tree', () => {
  fancy
  .stdout()
  .end('shows the tree', output => {
    const tree = CliUx.ux.tree()
    tree.insert('foo')
    tree.insert('bar')

    const subtree = CliUx.ux.tree()
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
