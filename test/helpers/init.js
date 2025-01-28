const path = require('node:path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

globalThis.oclif = globalThis.oclif || {}
globalThis.oclif.columns = 80
globalThis.columns = '80'
