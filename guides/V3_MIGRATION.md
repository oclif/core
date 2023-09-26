Migrating to @oclif/core@V3
==============

- [Migrating to @oclif/core@V3](#migrating-to-oclifcorev3)
  - [BREAKING CHANGES ❗](#breaking-changes-)
    - [Dropping node 14 and node 16 support](#dropping-node-14-and-node-16-support)
    - [Bin Scripts for ESM/CJS Interoperability](#bin-scripts-for-esmcjs-interoperability)
    - [Dropped `ts-node` as a dependency](#dropped-ts-node-as-a-dependency)
    - [`Config.plugins`](#configplugins)
    - [Readonly properties on `Config`](#readonly-properties-on-config)
    - [Private methods on `Plugin`](#private-methods-on-plugin)
    - [`global['cli-ux']` -\> `global.ux`](#globalcli-ux---globalux)
    - [`handle`](#handle)
    - [`noCacheDefault` flag property replaces `isWritingManifest`](#nocachedefault-flag-property-replaces-iswritingmanifest)
  - [Features 🎉](#features-)
    - [Performance Improvements](#performance-improvements)
    - [charAliases Flag Property](#charaliases-flag-property)
    - [Flags.option](#flagsoption)
    - [Set spinner styles](#set-spinner-styles)


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

### Dropped `ts-node` as a dependency

We removed `ts-node` as a dependency to reduce the package size. By doing this, it means that linked plugin **must** have `ts-node` as a `devDependency` in order for auto-transpilation to work.

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

Version 3 removes the `isWritingManifest` parameter in favor of a flag and arg property, `noCacheDefault`. Setting it to true will automatically keep it from being cached in the manifest.

```typescript
export const mySensitiveFlag = Flags.string({
  noCacheDefault: true,
  default: async (context) => {
    return 'sensitive info'
  },
});
```


## Features 🎉

### Performance Improvements

- Cache command permutations for flexible taxonomy in the `oclif.manifest.json`
- Cache additional command properties (`isESM`, `relativePath`) in the `oclif.manifest.json`
- Improved accuracy in the `DEBUG=perf` output.
- Remove `ts-node` from `dependencies` to reduce the package size.

### charAliases Flag Property

You can now define single character flag aliases using the `charAliases` property.

### Flags.option

There's a new flag type that infers the flag's type from the provided options.

In v2 you would have needed to do something like this,

```typescript
type Options = 'foo' | 'bar'
export default class MyCommand extends Command {
  static flags = {
    name: Flags.custom<Options>({
      options: ['foo', 'bar'],
    })(),
  }
}
```

Now in v3 you can do this,

```typescript
export default class MyCommand extends Command {
  static flags = {
    name: Flags.option({
      options: ['foo', 'bar'] as const,
    })(),
  }
}
```

### Set spinner styles

You can now configure the style of the spinner when using `ux.action.start`. See [spinners](https://github.com/oclif/core/blob/main/src/cli-ux/action/spinners.ts) for all the different options.

```typescript
ux.action.start('starting spinner', 'spinning', {style: 'arc'})
await ux.wait(2500)
ux.action.status = 'still going'
await ux.wait(2500)
ux.action.stop()
```
