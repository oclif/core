/* eslint-disable no-await-in-loop */
import type {PackageInformation, PackageLocator, getPackageInformation} from 'pnpapi'

import makeDebug from 'debug'
import {basename, dirname, join} from 'node:path'

import {PJSON} from '../interfaces'
import {safeReadJson} from './fs'

const debug = makeDebug('find-root')

// essentially just "cd .."
function* up(from: string) {
  while (dirname(from) !== from) {
    yield from
    from = dirname(from)
  }

  yield from
}

/**
 * Return the plugin root directory from a given file. This will `cd` up the file system until it finds
 * a package.json and then return the dirname of that path.
 *
 * Example: node_modules/@oclif/plugin-version/dist/index.js -> node_modules/@oclif/plugin-version
 */
async function findPluginRoot(root: string, name?: string) {
  // If we know the plugin name then we just need to traverse the file
  // system until we find the directory that matches the plugin name.
  debug.extend(name ?? 'root-plugin')(`Finding root starting at ${root}`)
  if (name) {
    for (const next of up(root)) {
      if (next.endsWith(basename(name))) {
        debug.extend(name)('Found root based on plugin name!')
        return next
      }
    }
  }

  // If there's no plugin name (typically just the root plugin), then we need
  // to traverse the file system until we find a directory with a package.json
  for (const next of up(root)) {
    // Skip the bin directory
    if (
      basename(dirname(next)) === 'bin' &&
      ['dev', 'dev.cmd', 'dev.js', 'run', 'run.cmd', 'run.js'].includes(basename(next))
    ) {
      continue
    }

    try {
      const cur = join(next, 'package.json')
      debug.extend(name ?? 'root-plugin')(`Checking ${cur}`)
      if (await safeReadJson<PJSON>(cur)) {
        debug.extend(name ?? 'root-plugin')('Found root by traversing up from starting point!')
        return dirname(cur)
      }
    } catch {}
  }
}

/**
 * Find plugin root directory for plugins installed into node_modules that don't have a `main` or `export`.
 * This will go up directories until it finds a directory with the plugin installed into it.
 *
 * See https://github.com/oclif/config/pull/289#issuecomment-983904051
 */
async function findRootLegacy(name: string | undefined, root: string): Promise<string | undefined> {
  debug.extend(name ?? 'root-plugin')('Finding root using legacy method')
  for (const next of up(root)) {
    let cur
    if (name) {
      cur = join(next, 'node_modules', name, 'package.json')
      if (await safeReadJson<PJSON>(cur)) return dirname(cur)

      const pkg = await safeReadJson<PJSON>(join(next, 'package.json'))
      if (pkg?.name === name) return next
    } else {
      cur = join(next, 'package.json')
      if (await safeReadJson<PJSON>(cur)) return dirname(cur)
    }
  }
}

let pnp: {
  getPackageInformation: typeof getPackageInformation
  getLocator: (name: string, reference: string | [string, string]) => PackageLocator
  getDependencyTreeRoots: () => PackageLocator[]
}

/**
 * The pnpapi module is only available if running in a pnp environment. Because of that
 * we have to require it from the plugin.
 *
 * Solution taken from here: https://github.com/yarnpkg/berry/issues/1467#issuecomment-642869600
 */
function maybeRequirePnpApi(root: string): unknown {
  if (pnp) return pnp
  try {
    // eslint-disable-next-line node/no-missing-require
    pnp = require(require.resolve('pnpapi', {paths: [root]}))
    return pnp
  } catch {}
}

const getKey = (locator: PackageLocator | string | [string, string] | undefined) => JSON.stringify(locator)
const isPeerDependency = (
  pkg: PackageInformation | undefined,
  parentPkg: PackageInformation | undefined,
  name: string,
) => getKey(pkg?.packageDependencies.get(name)) === getKey(parentPkg?.packageDependencies.get(name))

/**
 * Traverse PnP dependency tree to find plugin root directory.
 *
 * Implementation adapted from https://yarnpkg.com/advanced/pnpapi#traversing-the-dependency-tree
 */
function findPnpRoot(name: string, root: string): string | undefined {
  maybeRequirePnpApi(root)
  if (!pnp) return

  debug.extend(name)('Finding root for using pnp method')
  const seen = new Set()

  const traverseDependencyTree = (locator: PackageLocator, parentPkg?: PackageInformation): string | undefined => {
    // Prevent infinite recursion when A depends on B which depends on A
    const key = getKey(locator)
    if (seen.has(key)) return

    const pkg = pnp.getPackageInformation(locator)

    if (locator.name === name) {
      return pkg.packageLocation
    }

    seen.add(key)

    for (const [name, referencish] of pkg.packageDependencies) {
      // Unmet peer dependencies
      if (referencish === null) continue

      // Avoid iterating on peer dependencies - very expensive
      if (parentPkg !== null && isPeerDependency(pkg, parentPkg, name)) continue

      const childLocator = pnp.getLocator(name, referencish)
      const foundSomething = traverseDependencyTree(childLocator, pkg)
      if (foundSomething) return foundSomething
    }

    // Important: This `delete` here causes the traversal to go over nodes even
    // if they have already been traversed in another branch. If you don't need
    // that, remove this line for a hefty speed increase.
    seen.delete(key)
  }

  // Iterate on each workspace
  for (const locator of pnp.getDependencyTreeRoots()) {
    const foundSomething = traverseDependencyTree(locator)
    if (foundSomething) return foundSomething
  }
}

/**
 * Returns the root directory of the plugin.
 *
 * It first attempts to use require.resolve to find the plugin root.
 * If that returns a path, it will `cd` up the file system until if finds the package.json for the plugin
 * Example: node_modules/@oclif/plugin-version/dist/index.js -> node_modules/@oclif/plugin-version
 *
 * If require.resolve throws an error, it will attempt to find the plugin root by traversing the file system.
 * If we're in a PnP environment (determined by process.versions.pnp), it will use the pnpapi module to
 * traverse the dependency tree. Otherwise, it will traverse the node_modules until it finds a package.json
 * with a matching name.
 *
 * If no path is found, undefined is returned which will eventually result in a thrown Error from Plugin.
 */
export async function findRoot(name: string | undefined, root: string) {
  if (name) {
    debug.extend(name)(`Finding root using ${root}`)
    let pkgPath
    try {
      pkgPath = require.resolve(name, {paths: [root]})
      debug.extend(name)(`Found starting point with require.resolve`)
    } catch {
      debug.extend(name)(`require.resolve could not find plugin starting point`)
    }

    if (pkgPath) {
      const found = await findPluginRoot(dirname(pkgPath), name)
      if (found) {
        debug.extend(name)(`Found root at ${found}`)
        return found
      }
    }

    const found = process.versions.pnp ? findPnpRoot(name, root) : await findRootLegacy(name, root)
    debug.extend(name)(found ? `Found root at ${found}` : 'No root found!')
    return found
  }

  debug.extend('root-plugin')(`Finding root plugin using ${root}`)
  const found = await findPluginRoot(root)
  debug.extend('root-plugin')(found ? `Found root at ${found}` : 'No root found!')
  return found
}
