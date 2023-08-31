Migrating to @oclif/core@V3
==============

- [Migrating to @oclif/core@V3](#migrating-to-oclifcorev3)
  - [BREAKING CHANGES ❗](#breaking-changes-)
    - [Dropping node 14 and node 16 support](#dropping-node-14-and-node-16-support)
    - [Bin Scripts for ESM/CJS Interoperability](#bin-scripts-for-esmcjs-interoperability)
    - [`Config.plugins`](#configplugins)
    - [Readonly properties on `Config`](#readonly-properties-on-config)
    - [Private methods on `Plugin`](#private-methods-on-plugin)
    - [`ux` exports](#ux-exports)
    - [`global['cli-ux']` -\> `global.ux`](#globalcli-ux---globalux)
    - [`handle`](#handle)
    - [`noCacheDefault` flag property replaces `isWritingManifest`](#nocachedefault-flag-property-replaces-iswritingmanifest)
  - [Features 🎉](#features-)
    - [Exports](#exports)
    - [Cache Flexible taxonomy Command Permutations](#cache-flexible-taxonomy-command-permutations)


## BREAKING CHANGES ❗

### Dropping node 14 and node 16 support
 The end-of-life date for Node.js 14 was [April 30, 2023](https://nodejs.org/en/about/releases/).

The end-of-life date for Node.js 16 was [September 11, 2023](https://nodejs.org/en/about/releases/). This date is earlier than previously published. Node.js’s [blog](https://nodejs.org/en/blog/announcements/nodejs16-eol/) explains why they chose this earlier end-of-life date.

### Bin Scripts for ESM/CJS Interoperability

In order to support ESM and CommonJS plugin interoperability you will need to update your bin scripts to match these:

[CJS Template](https://github.com/oclif/hello-world/tree/main/bin)

[ESM Template](https://github.com/oclif/hello-world-esm/tree/main/bin)

**You will also need to update any references to the bin scripts to include the .js extension.**

If you'd like to migrate your plugin to ESM, please read our guide [here](https://oclif.io/docs/esm)

### `Config.plugins`
`Config.plugins` is now a `Map` where the keys are the plugin names and the values are the loaded `Plugin` instances. Previously it was an array of loaded `Plugin` instances.

By using a `Map` we can now do more efficient lookups during command execution. `Config.getPluginsList` was added in case you still would like a flat array of `Plugin` instances.

### Readonly properties on `Config`
Various properties on `Config` are now `readonly`
    - `name`
    - `version`
    - `channel`
    - `pjson`
    - `root`
    - `arch`
    - `bin`
    - `cacheDir`
    - `configDir`
    - `dataDir`
    - `dirname`
    - `errLog`
    - `home`
    - `platform`
    - `shell`
    - `userAgent`
    - `windows`
    - `debug`
    - `npmRegistry`
    - `userPJSON`
    - `plugins`
    - `binPath`
    - `binAliases`
    - `nsisCustomization`
    - `valid`
    - `flexibleTaxonomy`
    - `commands`

### Private methods on `Plugin`
The `_manifest` and `warn` methods on `Plugin` are now `private`

### `ux` exports

The following exports are no longer available on `ux`:

- `ActionBase`
- `config`
- `Config`
- `ExitError`
- `IPromptOptions`
- `Table`

If you still need these you can import them from `@oclif/core/ux`:

```typescript
import {
  ActionBase,
  config,
  Config,
  ExitError,
  IPromptOptions,
  Table,
} from '@oclif/core/ux'
```

### `global['cli-ux']` -> `global.ux`

The global `cli-ux` object has been renamed to `ux` to be consistent with the module's name

### `handle`

The exported `handle` function for handling errors in bin scripts is now asynchronous

### `noCacheDefault` flag property replaces `isWritingManifest`

Version 2 allowed you to optionally return non-sensitive input if the `default` or `defaultHelp` flag/arg properties were called during manifest creation. This is helpful if you don't want sensitive data to be put into the `oclif.manifest.json` and then released to npm. To do this you had to handle the `isWritingManifest` parameter passed in to the `default` and `defaultHelp` callbacks.

```typescript
export const mySensitiveFlag = Flags.string({
  default: async (context, isWritingManifest) => {
    if (isWritingManifest) {
      return undefined;
    }

    return 'sensitive info'
  },
});
```

Version 3 removes the `isWritingManifest` parameter in favor of a flag and arg property, `noCacheDefault`. Setting it to true will automatically keep it from being cached in the manfiest.

```typescript
export const mySensitiveFlag = Flags.string({
  noCacheDefault: true,
  default: async (context) => {
    return 'sensitive info'
  },
});
```


## Features 🎉

### Exports
The `exports` property in the package.json are now used for exporting individual pieces of functionality.

The main export should continue to work as it did in v2:

```typescript
import {Interfaces, ux} from '@oclif/core'
```

But you can now import individual modules if desired:

```typescript
import Interfaces from '@oclif/core/interfaces'
import ux from '@oclif/core/ux'
```

These are the exports that are available:
`@oclif/core/execute`
`@oclif/core/flush`
`@oclif/core/handle`
`@oclif/core/interfaces`
`@oclif/core/run`
`@oclif/core/settings`
`@oclif/core/ux`

**You will need to set moduleResolution to Node16 in your tsconfig.json to use this feature.**

### Cache Flexible taxonomy Command Permutations

The command permutations for flexible taxonomy are now cached in the oclif.manifest.json allowing for quicker startup times.
