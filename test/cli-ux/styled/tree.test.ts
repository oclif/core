import {expect, fancy} from 'fancy-test'

import {ux} from '../../../src/cli-ux'

describe('styled/tree', () => {
  fancy.stdout().end('shows the tree', (output) => {
    const tree = ux.tree()
    tree.insert('foo')
    tree.insert('bar')

    const subtree = ux.tree()
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
