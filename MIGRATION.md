Migrating to @oclif/core
==============

Migrating to `@oclif/core` from the old oclif libraries (`@oclif/config`, `@oclif/command`, `@oclif/error`, `@oclif/parser`) is relatively straight forward.

- [Migrating to @oclif/core](#migrating-to-oclifcore)
  - [Update Imports](#update-imports)
  - [Update your bin scirpts](#update-your-bin-scirpts)
  - [Add `main` to your package.json](#add-main-to-your-packagejson)
  - [Restore `-h`, `-v`, and `version`](#restore--h--v-and-version)
  - [Configure the `topicSeparator`](#configure-the-topicseparator)
  - [Update `this.parse` to `await this.parse`](#update-thisparse-to-await-thisparse)
  - [Update `default` property on flag defintions](#update-default-property-on-flag-defintions)
  - [Replace cli-ux library with `CliUx`](#replace-cli-ux-library-with-cliux)

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

## Update your bin scirpts

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
    "@oclif/plugin-version": "^1"
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

## Update `default` property on flag defintions

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

## Replace cli-ux library with `CliUx`

The [`cli-ux` library](https://github.com/oclif/cli-ux) has also been moved into `@oclif/core` in order to break a complex circular dependency between the two projects.

All the exports that were available from `cli-ux` are now available under the `CliUx` namespace, with the exception of the `cli` export which was identical to the `ux` export.

Old:

```typescript
import { cli } from 'cli-ux`

cli.log('hello world')
cli.action.start('doing things')
cli.action.stop()
```

New:

```typescript
import { CliUx } from '@oclif/core`

CliUx.ux.log('hello world')
CliUx.ux.action.start('doing things')
CliUx.ux.action.stop()
```
