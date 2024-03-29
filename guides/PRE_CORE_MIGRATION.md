Migrating to @oclif/core from deprecated libraries
==============

Migrating to `@oclif/core` from the deprecated oclif libraries (`@oclif/config`, `@oclif/command`, `@oclif/error`, `@oclif/parser`) is relatively straight forward.

- [Migrating to @oclif/core from deprecated libraries](#migrating-to-oclifcore-from-deprecated-libraries)
  - [Update Imports](#update-imports)
  - [Update Command Args](#update-command-args)
  - [Update your bin scripts](#update-your-bin-scripts)
  - [Add `main` to your package.json](#add-main-to-your-packagejson)
  - [Restore `-h`, `-v`, and `version`](#restore--h--v-and-version)
  - [Configure the `topicSeparator`](#configure-the-topicseparator)
  - [Update `this.parse` to `await this.parse`](#update-thisparse-to-await-thisparse)
  - [Update `default` property on flag definitions](#update-default-property-on-flag-definitions)
  - [Replace cli-ux library with `ux`](#replace-cli-ux-library-with-ux)
  - [Single command CLIs](#single-command-clis)

## Update Imports

Replace imports from the old libraries with `@oclif/core`. For example,

```typescript
import Help from '@oclif/plugin-help';
import {Topic} from '@oclif/config';
import {Command, Flags} from '@oclif/command'
```

With this import:

```typescript
import {Command, Flags, Topic, Help} from '@oclif/core';
```

## Update Command Args

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


## Update your bin scripts

`@oclif/core` now supports separate bin scripts for production and development.

You can copy these new bin scripts directly from our [example repository](https://github.com/oclif/hello-world/tree/main/bin).

## Add `main` to your package.json

We recommend that all oclif plugins specify the `main` field in their package.json so that we can begin working on supporting Yarn v2.

```json
{
  "main": "lib/index.js"
}
```

All plugins will be required to have this field in the next major version of `@oclif/core`.

## Restore `-h`, `-v`, and `version`

`@oclif/config` automatically added `-h` as a short flag for `--help`, `-v` as a short flag for `--version`, and `version` as an alias for `--version`.

`@oclif/core` removes these so you can now use those flags for whatever you want! However, we've added a way to restore that functionality if you want to keep it.

Simply add the `additionalHelpFlags` and `additionalVersionFlags` properties to the oclif section of your package.json:

```json
{
  "oclif": {
    "additionalHelpFlags": ["-h"],
    "additionalVersionFlags": ["-v"]
  }
}
```

To get the `version` command, install `@oclif/plugin-version` into your CLI:

```json
{
  "dependencies": {
    "@oclif/plugin-version": "^3"
  },
  "oclif": {
    "plugins": [
      "@oclif/plugin-version"
    ]
  }
}
```

## Configure the `topicSeparator`

By default, the `topicSeparator` is set to a colon (`:`) to maintain backwards compatibility with existing CLIs. If you prefer, you can now set it to a space.

For colons:
```json
{
  "oclif": {
    "topicSeparator": ":"
  }
}
```

For spaces:
```json
{
  "oclif": {
    "topicSeparator": " "
  }
}
```

**NOTE: Using colons always works, even if you set the `topicSeparator` to spaces.** This means that you can enable spaces in your CLI without introducing a breaking change to your users.

## Update `this.parse` to `await this.parse`

The `parse` method on `Command` is now asynchronous (more [here](https://oclif.io/blog/#async-command-parsing)). So you'll now need to `await` any calls to `this.parse`:

`const { args, flags } = this.parse(MyCommand)` => `const { args, flags } = await this.parse(MyCommand)`

## Update `default` property on flag definitions

The `default` property on flag definitions is now asynchronous. So you'll now need to await those.

Example:

```typescript
import {Command, Flags} from '@oclif/core'
import {readFile} from 'fs/promises'

function getTeam(): Promise<string> {
  return readFile('team.txt', 'utf-8')
}

export const team = Flags.build({
  char: 't',
  description: 'team to use',
  default: () => getTeam(),
})

export class MyCLI extends Command {
  static flags = {
    team: team(),
  }

  async run() {
    const {flags} = this.parse(MyCLI)
    if (flags.team) console.log(`--team is ${flags.team}`)
  }
}
```

## Replace cli-ux library with `ux`

The [`cli-ux` library](https://github.com/oclif/cli-ux) has also been moved into `@oclif/core` in order to break a complex circular dependency between the two projects.

All the exports that were available from `cli-ux` are now available under the `ux` namespace, with the exception of the `cli` export which was identical to the `ux` export.

Old:

```typescript
import { cli } from 'cli-ux`

cli.log('hello world')
cli.action.start('doing things')
cli.action.stop()
```

New:

```typescript
import { ux } from '@oclif/core`

ux.log('hello world')
ux.action.start('doing things')
ux.action.stop()
```

## Single command CLIs

Single command CLIs now are configured in a different way. To ensure your migrated CLI work as before, you have to add the following to your `oclif` configuration in the `package.json`:

```json
"oclif": {
  "default": ".",
  "commands": "./lib"
}
```

Where `./lib` points to the folder in which your `tsconfig.json` is configured to output to (if you are using TypeScript), and your single command CLI entrypoint `index.(ts|js)` is located.
