@oclif/core
===========

base library for oclif CLIs

[![Version](https://img.shields.io/npm/v/@oclif/core.svg)](https://npmjs.org/package/@oclif/core)
[![CircleCI](https://circleci.com/gh/oclif/core/tree/main.svg?style=svg)](https://circleci.com/gh/oclif/core/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/@oclif/core.svg)](https://npmjs.org/package/@oclif/core)
[![License](https://img.shields.io/npm/l/@oclif/core.svg)](https://github.com/oclif/core/blob/main/package.json)


Migrating
=====

If you're migrating from the old oclif libraries (`@oclif/config`, `@oclif/command`, `@oclif/error`, `@oclif/parser`), see the [migration guide](./MIGRATION.md).

The `@oclif/core` module now also includes the `cli-ux` module. Merging `cli-ux` into `@oclif/core` resolves a circular dependency between the two modules.
See the [cli-ux README](./src/cli-ux/README.md) for instructions on how to replace the `cli-ux` module with `@oclif/core`.
The [cli-ux README](./src/cli-ux/README.md) also contains detailed usage examples.

Usage
=====

We strongly encourage you generate an oclif CLI using the [oclif cli](https://github.com/oclif/oclif). The generator will generate an npm package with `@oclif/core` as a dependency.

You can, however, use `@oclif/core` in a standalone script like this:
```typescript
#!/usr/bin/env ts-node

import * as fs from 'fs'
import {Command, Flags} from '@oclif/core'

class LS extends Command {
  static description = 'List the files in a directory.'
  static flags = {
    version: Flags.version(),
    help: Flags.help(),
    dir: Flags.string({
      char: 'd',
      default: process.cwd(),
    }),
  }

  async run() {
    const {flags} = await this.parse(LS)
    const files = fs.readdirSync(flags.dir)
    for (const f of files) {
      this.log(f)
    }
  }
}

LS.run().then(() => {
  require('@oclif/core/flush')
}, () => {
  require('@oclif/core/handle')
})
```

Then run it like this:

```sh-session
$ ts-node myscript.ts
...files in current dir...
```
