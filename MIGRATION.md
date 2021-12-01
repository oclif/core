Migrating to @oclif/core
==============

Migrating to `@oclif/core` from the old oclif libraries (`@oclif/config`, `@oclif/command`, `@oclif/error`, `@oclif/parser`) is relatively straight forward.

## Update Imports

Replace imports from the old libraries with `@oclif/core`. For example,

```typescript
import Help from '@oclif/plugin-help';
import {Topic} from '@oclif/config';
import {Command, flags} from '@oclif/command'
```

With this import:

```typescript
import {Command, flags, Topic, Help} from '@oclif/core';
```

## Update your bin scirpts

`@oclif/core` now supports separate bin scripts for production and development.

You can copy these new bin scripts directly from our [example repository](https://github.com/oclif/hello-world/tree/main/bin).

## Restore `-h`, `-v`, and `version`

`@oclif/config` automatically added `-h` as a short flag for `--help`, `-v` as a short flag for `--version`, and `version` as an alias for `--version`.

`@oclif/core` removes these so you can now use the flags for whatever you want! However, we've added a way to restore that functionality if you want to keep it.

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

By default, the `topicSeparator` is set to a colon (`:`) to maintain backwards compatibility with exiting CLIs. If you prefer, you can now set it to a space.

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
