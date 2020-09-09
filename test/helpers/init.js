const path = require('path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')

global.columns = 80
process.env.FORCE_COLOR = '0'
