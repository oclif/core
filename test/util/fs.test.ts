import {expect} from 'chai'

import {readJson} from '../../src/util/fs'

describe('readJson', () => {
  it('should return parsed JSON', async () => {
    const json = await readJson<{name: string}>('package.json')
    expect(json.name).to.equal('@oclif/core')
  })

  it('should throw an error if the file does not exist', async () => {
    try {
      await readJson('does-not-exist.json')
      throw new Error('Expected an error to be thrown')
    } catch (error) {
      const err = error as Error
      expect(err.message).to.include('ENOENT: no such file or directory')
    }
  })
})
