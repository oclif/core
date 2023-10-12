Migrating to @oclif/core@V2
==============

## Breaking Changes

### Command Args

We updated the `Command.args` to more closely resemble flags

**Before**

```typescript
import { Command } from '@oclif/core'

export default MyCommand extends Command {
  static args = [{name: arg1, description: 'an argument', required: true}]

  public async run(): Promise<void> {
    const {args} = await this.parse(MyCommand) // args is useless {[name: string]: any}
  }
}
```

**After**

```typescript
import { Command, Args } from '@oclif/core'

export default MyCommand extends Command {
  static args = {
    arg1: Args.string({description: 'an argument', required: true})
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(MyCommand) // args is { arg1: string }
  }
}
```

These are the available Args:
- string
- integer
- boolean
- url
- file
- directory
- custom

### Interfaces

- Removed `Interfaces.Command` since they were not usable for tests. These are replaced by types that are available under the `Command` namespace

```
Interfaces.Command => Command.Cached
Interfaces.Command.Class => Command.Class
Interfaces.Command.Loadable => Command.Lodable
```

- Removed the following interfaces from the export. Exporting all of these made it difficult to make non-breaking changes when modifying types and/or fixing compilation bugs. We are open to PRs to reintroduce these to the export if they are needed for your project
  - Arg
  - ArgInput
  - ArgToken
  - CLIParseErrorOptions
  - CompletableFlag
  - CompletableOptionFlag
  - Completion
  - CompletionContext
  - Default
  - DefaultContext
  - Definition
  - EnumFlagOptions
  - FlagBase
  - FlagInput
  - FlagOutput
  - FlagToken
  - FlagUsageOptions
  - Input
  - List
  - ListItem
  - Metadata
  - OptionalArg
  - OptionFlagProps
  - OutputArgs
  - OutputFlags
  - ParseFn
  - ParserArg
  - ParserInput
  - ParserOutput
  - ParsingToken
  - RequiredArg

### CliUx

We flattened `CliUx.ux` into `ux` for ease of use

**Before**

```typescript
import {CliUx} from '@oclif/core'

CliUx.ux.log('Hello World')
```

**After**

```typescript
import {ux} from '@oclif/core'

ux.log('Hello World')
```

#### CliUx.ux.open

We removed the `open` method since it was a direct import/export of the [`open`](https://www.npmjs.com/package/open) package. If you need this functionality, then you should import `open` yourself.

### Flags

- Flags.custom replaces Flags.build, Flags.enum, and Flags.option
- Removed builtin `color` flag
- Renamed `globalFlags` to `baseFlags`
  - `globalFlags` was a misleading name because the flags added there weren't actually global to the entire CLI. Instead, they were just flags that would be inherited by any command that extended the command class they were defined in.

### Flag and Arg Parsing

- In v1, any input that didn't match a flag definition was assumed to be an argument. This meant that misspelled flags, e.g. `--hekp` were parsed as arguments, instead of throwing an error. In order to handle this, oclif now assumes that anything that starts with a hyphen must be a flag and will throw an error if no corresponding flag definition is found. **In other words, your command can no longer accept arguments that begin with a hyphen** (fixes https://github.com/oclif/core/issues/526)
- v1 allowed you to return an array from a flag's `parse`. This was added to support backwards compatibility for flags that separated values by commas (e.g. `my-flag=val1,val2`). However, this was problematic because it didn't allow the `parse` to manipulate the individual values. If you need this functionality, you can now set a `delimiter` option on your flags. By doing so, oclif will split the string on the delimiter before parsing.

## ESM/CJS Friendliness

Writing plugins with ESM has always been possible, but it requires [a handful of modifications](https://oclif.io/docs/esm) for it to work, especially in the bin scripts. In v2 we've introduced an `execute` method that the bin scripts can use to avoid having to make changes for ESM of CJS.

**CJS `bin/dev` before**
```typescript
#!/usr/bin/env node

const oclif = require('@oclif/core')

const path = require('path')
const project = path.join(__dirname, '..', 'tsconfig.json')

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development'

require('ts-node').register({project})

// In dev mode, always show stack traces
oclif.settings.debug = true;


// Start the CLI
oclif.run().then(oclif.flush).catch(oclif.Errors.handle)
```

**CJS `bin/dev.js` after**
```typescript
#!/usr/bin/env node
// eslint-disable-next-line node/shebang
(async () => {
  const oclif = await import('@oclif/core')
  await oclif.execute({type: 'cjs', development: true, dir: __dirname})
})()
```

**ESM `bin/dev.js` before**
```typescript
#!/usr/bin/env ts-node

/* eslint-disable node/shebang */

import oclif from '@oclif/core'
import path from 'node:path'
import url from 'node:url'
// eslint-disable-next-line node/no-unpublished-import
import {register} from 'ts-node'

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development'

register({
  project: path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'tsconfig.json'),
})

// In dev mode, always show stack traces
oclif.settings.debug = true

// Start the CLI
oclif
.run(process.argv.slice(2), import.meta.url)
.then(oclif.flush)
.catch(oclif.Errors.handle)
```

**ESM `bin/dev.js` after**
```typescript
#!/usr/bin/env node
// eslint-disable-next-line node/shebang
(async () => {
  const oclif = await import('@oclif/core')
  await oclif.execute({type: 'esm', dir: import.meta.url})
})()
```

Note that ESM and CJS plugins still require different settings in the tsconfig.json - you will still need to make those modifications yourself.

## Other Changes
- Removed dependency on `@oclif/screen`
- Replaced `@oclif/linewrap` with `wordwrap`
