# @oclif/core

base library for oclif CLIs

[![Version](https://img.shields.io/npm/v/@oclif/core.svg)](https://npmjs.org/package/@oclif/core)
[![Downloads/week](https://img.shields.io/npm/dw/@oclif/core.svg)](https://npmjs.org/package/@oclif/core)
[![License](https://img.shields.io/npm/l/@oclif/core.svg)](https://github.com/oclif/core/blob/main/package.json)

# Migrating

See the [v3 migration guide](./guides/V3_MIGRATION.md) for an overview of breaking changes that occurred between v2 and v3.

See the [v2 migration guide](./guides/V2_MIGRATION.md) for an overview of breaking changes that occurred between v1 and v2.

Migrating from `@oclif/config` and `@oclif/command`? See the [v1 migration guide](./guides/PRE_CORE_MIGRATION.md).

# CLI UX

The [ux README](./src/cli-ux/README.md) contains detailed usage examples of using the `ux` export.

# Usage

We strongly encourage you generate an oclif CLI using the [oclif cli](https://github.com/oclif/oclif). The generator will generate an npm package with `@oclif/core` as a dependency.

You can, however, use `@oclif/core` in a standalone script like this:

```typescript
#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning

import * as fs from 'fs'
import {Command, Flags, flush, handle} from '@oclif/core'

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

LS.run().then(
  async () => {
    await flush()
  },
  async (err) => {
    await handle(err)
  },
)
```

Then run it like this:

```sh-session
$ ts-node myscript.ts
...files in current dir...
```
