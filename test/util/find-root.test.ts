import {expect} from 'chai'
import {mkdir, mkdtemp, realpath, rm, symlink, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {findRoot} from '../../src/util/find-root'

async function writePackage(dir: string, pjson: Record<string, unknown>) {
  await mkdir(dir, {recursive: true})
  await writeFile(path.join(dir, 'package.json'), JSON.stringify(pjson))
  await writeFile(path.join(dir, 'index.js'), '')
}

describe('findRoot', () => {
  let dataDir: string
  let store: string

  // The layout pnpm installs into: each package in the store, next to its own dependencies,
  // and a symlink to it in the node_modules of the package that depends on it.
  //
  // data/node_modules/<name> -> data/node_modules/.pnpm/<name>@1.0.0/node_modules/<name>
  // data/node_modules/.pnpm/<name>@1.0.0/node_modules/child -> data/node_modules/.pnpm/child@1.0.0/node_modules/child
  async function install(name: string, pjson: Record<string, unknown>) {
    const real = path.join(store, `${name}@1.0.0`, 'node_modules', name)
    await writePackage(real, {name, version: '1.0.0', ...pjson})
    await symlink(
      path.join(store, 'child@1.0.0', 'node_modules', 'child'),
      path.join(store, `${name}@1.0.0`, 'node_modules', 'child'),
    )
    await symlink(real, path.join(dataDir, 'node_modules', name))
    return realpath(real)
  }

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'find-root-'))
    store = path.join(dataDir, 'node_modules', '.pnpm')
    await writePackage(dataDir, {name: 'data', private: true})
    await writePackage(path.join(store, 'child@1.0.0', 'node_modules', 'child'), {
      main: 'index.js',
      name: 'child',
      version: '1.0.0',
    })
  })

  afterEach(async () => {
    await rm(dataDir, {force: true, recursive: true})
  })

  it('returns the real path of a symlinked plugin with a main', async () => {
    const real = await install('with-main', {main: 'index.js'})
    expect(await findRoot('with-main', path.join(dataDir, 'package.json'))).to.equal(real)
  })

  it('returns the real path of a symlinked plugin with neither a main nor a "." export', async () => {
    const real = await install('no-main', {exports: {'./commands': './index.js'}})
    expect(await findRoot('no-main', path.join(dataDir, 'package.json'))).to.equal(real)
  })

  it('finds the dependencies of a symlinked plugin with neither a main nor a "." export', async () => {
    await install('no-main', {exports: {'./commands': './index.js'}})
    const root = await findRoot('no-main', path.join(dataDir, 'package.json'))
    expect(await findRoot('child', root!)).to.equal(
      await realpath(path.join(store, 'child@1.0.0', 'node_modules', 'child')),
    )
  })
})
