import {expect, fancy} from 'fancy-test'

import {ux} from '../../../src/cli-ux'
import * as screen from '../../../src/screen'

/* eslint-disable camelcase */
const apps = [
  {
    build_stack: {
      id: '123',
      name: 'heroku-16',
    },
    created_at: '2000-01-01T22:34:46Z',
    id: '123',
    git_url: 'https://git.heroku.com/supertable-test-1.git',
    name: 'supertable-test-1',
    owner: {
      email: 'example@heroku.com',
      id: '1',
    },
    region: {id: '123', name: 'us'},
    released_at: '2000-01-01T22:34:46Z',
    stack: {
      id: '123',
      name: 'heroku-16',
    },
    updated_at: '2000-01-01T22:34:46Z',
    web_url: 'https://supertable-test-1.herokuapp.com/',
  },
  {
    build_stack: {
      id: '321',
      name: 'heroku-16',
    },
    created_at: '2000-01-01T22:34:46Z',
    id: '321',
    git_url: 'https://git.heroku.com/phishing-demo.git',
    name: 'supertable-test-2',
    owner: {
      email: 'example@heroku.com',
      id: '1',
    },
    region: {id: '321', name: 'us'},
    released_at: '2000-01-01T22:34:46Z',
    stack: {
      id: '321',
      name: 'heroku-16',
    },
    updated_at: '2000-01-01T22:34:46Z',
    web_url: 'https://supertable-test-2.herokuapp.com/',
  },
]

const columns = {
  id: {header: 'ID'},
  name: {},
  web_url: {extended: true},
  stack: {extended: true, get: (r: any) => r.stack && r.stack.name},
}
/* eslint-enable camelcase */

const ws = ' '

// ignore me
// stored up here for line wrapping reasons
const extendedHeader = `ID  Name${ws.padEnd(14)}Web url${ws.padEnd(34)}Stack${ws.padEnd(5)}`

// tests to-do:
// no-truncate
// truncation rules?

describe('styled/table', () => {
  fancy.end('export flags and display()', () => {
    expect(typeof ux.table.flags()).to.eq('object')
    expect(typeof ux.table).to.eq('function')
  })

  fancy.end('has optional flags', (_) => {
    const flags = ux.table.flags()
    expect(flags.columns).to.exist
    expect(flags.sort).to.exist
    expect(flags.filter).to.exist
    expect(flags.csv).to.exist
    expect(flags.output).to.exist
    expect(flags.extended).to.exist
    expect(flags['no-truncate']).to.exist
    expect(flags['no-header']).to.exist
  })

  fancy.stdout().end('displays table', (output) => {
    ux.table(apps, columns)
    expect(output.stdout).to.equal(` ID  Name${ws.padEnd(14)}
 ─── ─────────────────${ws}
 123 supertable-test-1${ws}
 321 supertable-test-2${ws}\n`)
  })

  describe('columns', () => {
    fancy.stdout().end('use header value for id', (output) => {
      ux.table(apps, columns)
      expect(output.stdout.slice(1, 3)).to.equal('ID')
    })

    fancy.stdout().end('shows extended columns/uses get() for value', (output) => {
      ux.table(apps, columns, {extended: true})
      expect(output.stdout).to.equal(`${ws}${extendedHeader}
 ─── ───────────────── ──────────────────────────────────────── ─────────${ws}
 123 supertable-test-1 https://supertable-test-1.herokuapp.com/ heroku-16${ws}
 321 supertable-test-2 https://supertable-test-2.herokuapp.com/ heroku-16${ws}\n`)
    })
  })

  describe('options', () => {
    fancy.stdout().end('shows extended columns', (output) => {
      ux.table(apps, columns, {extended: true})
      expect(output.stdout).to.contain(extendedHeader)
    })

    fancy.stdout().end('shows title with divider', (output) => {
      ux.table(apps, columns, {title: 'testing'})
      expect(output.stdout).to.equal(`testing
=======================
| ID  Name${ws.padEnd(14)}
| ─── ─────────────────${ws}
| 123 supertable-test-1${ws}
| 321 supertable-test-2${ws}\n`)
    })

    fancy.stdout().end('skips header', (output) => {
      ux.table(apps, columns, {'no-header': true})
      expect(output.stdout).to.equal(` 123 supertable-test-1${ws}
 321 supertable-test-2${ws}\n`)
    })

    fancy.stdout().end('only displays given columns', (output) => {
      ux.table(apps, columns, {columns: 'id'})
      expect(output.stdout).to.equal(` ID${ws}${ws}
 ───${ws}
 123${ws}
 321${ws}\n`)
    })

    fancy.stdout().end('outputs in csv', (output) => {
      ux.table(apps, columns, {output: 'csv'})
      expect(output.stdout).to.equal(`ID,Name
123,supertable-test-1
321,supertable-test-2\n`)
    })

    fancy.stdout().end('outputs in csv with escaped values', (output) => {
      ux.table(
        [
          {
            id: '123\n2',
            name: 'supertable-test-1',
          },
          {
            id: '12"3',
            name: 'supertable-test-2',
          },
          {
            id: '1"2"3',
            name: 'supertable-test-3',
          },
          {
            id: '123',
            name: 'supertable-test-4,comma',
          },
          {
            id: '123',
            name: 'supertable-test-5',
          },
        ],
        columns,
        {output: 'csv'},
      )
      expect(output.stdout).to.equal(`ID,Name
"123\n2","supertable-test-1"
"12""3","supertable-test-2"
"1""2""3","supertable-test-3"
"123","supertable-test-4,comma"
123,supertable-test-5\n`)
    })

    fancy.stdout().end('outputs in csv without headers', (output) => {
      ux.table(apps, columns, {output: 'csv', 'no-header': true})
      expect(output.stdout).to.equal(`123,supertable-test-1
321,supertable-test-2\n`)
    })

    fancy.stdout().end('outputs in csv with alias flag', (output) => {
      ux.table(apps, columns, {csv: true})
      expect(output.stdout).to.equal(`ID,Name
123,supertable-test-1
321,supertable-test-2\n`)
    })

    fancy.stdout().end('outputs in json', (output) => {
      ux.table(apps, columns, {output: 'json'})
      expect(output.stdout).to.equal(`[
  {
    "id": "123",
    "name": "supertable-test-1"
  },
  {
    "id": "321",
    "name": "supertable-test-2"
  }
]
`)
    })

    fancy.stdout().end('outputs in yaml', (output) => {
      ux.table(apps, columns, {output: 'yaml'})
      expect(output.stdout).to.equal(`- id: '123'
  name: supertable-test-1
- id: '321'
  name: supertable-test-2

`)
    })

    fancy.stdout().end('sorts by property', (output) => {
      ux.table(apps, columns, {sort: '-name'})
      expect(output.stdout).to.equal(` ID  Name${ws.padEnd(14)}
 ─── ─────────────────${ws}
 321 supertable-test-2${ws}
 123 supertable-test-1${ws}\n`)
    })

    fancy.stdout().end('filters by property & value (partial string match)', (output) => {
      ux.table(apps, columns, {filter: 'id=123'})
      expect(output.stdout).to.equal(` ID  Name${ws.padEnd(14)}
 ─── ─────────────────${ws}
 123 supertable-test-1${ws}\n`)
    })

    fancy.stdout().end('does not truncate', (output) => {
      const three = {...apps[0], id: '0'.repeat(80), name: 'supertable-test-3'}
      ux.table([...apps, three], columns, {filter: 'id=0', 'no-truncate': true})
      expect(output.stdout).to.equal(` ID${ws.padEnd(78)} Name${ws.padEnd(14)}
 ${''.padEnd(three.id.length, '─')} ─────────────────${ws}
 ${three.id} supertable-test-3${ws}\n`)
    })
  })

  describe('#flags', () => {
    fancy.end('includes only flags', (_) => {
      const flags = ux.table.flags({only: 'columns'})
      expect(flags.columns).to.be.a('object')
      expect((flags as any).sort).to.be.undefined
    })

    fancy.end('excludes except flags', (_) => {
      const flags = ux.table.flags({except: 'columns'})
      expect((flags as any).columns).to.be.undefined
      expect(flags.sort).to.be.a('object')
    })
  })

  describe('edge cases', () => {
    fancy.stdout().end('ignores header case', (output) => {
      ux.table(apps, columns, {columns: 'iD,Name', filter: 'nAMe=supertable-test', sort: '-ID'})
      expect(output.stdout).to.equal(` ID  Name${ws.padEnd(14)}
 ─── ─────────────────${ws}
 321 supertable-test-2${ws}
 123 supertable-test-1${ws}\n`)
    })

    fancy.stdout().end('displays multiline cell', (output) => {
      /* eslint-disable camelcase */
      const app3 = {
        build_stack: {
          name: 'heroku-16',
        },
        id: '456',
        name: 'supertable-test\n3',
        web_url: 'https://supertable-test-1.herokuapp.com/',
      }
      /* eslint-enable camelcase */

      ux.table([...apps, app3 as any], columns, {sort: '-ID'})
      expect(output.stdout).to.equal(` ID  Name${ws.padEnd(14)}
 ─── ─────────────────${ws}
 456 supertable-test${ws.padEnd(3)}
     3${ws.padEnd(17)}
 321 supertable-test-2${ws}
 123 supertable-test-1${ws}\n`)
    })

    const orig = {
      stdtermwidth: screen.stdtermwidth,
      CLI_UX_SKIP_TTY_CHECK: process.env.CLI_UX_SKIP_TTY_CHECK,
    }

    fancy
      .do(() => {
        Object.assign(screen, {stdtermwidth: 9})
        process.env.CLI_UX_SKIP_TTY_CHECK = 'true'
      })
      .finally(() => {
        Object.assign(screen, {stdtermwidth: orig.stdtermwidth})
        process.env.CLI_UX_SKIP_TTY_CHECK = orig.CLI_UX_SKIP_TTY_CHECK
      })
      .stdout({stripColor: false})
      .end('correctly truncates columns with fullwidth characters or ansi escape sequences', (output) => {
        /* eslint-disable camelcase */
        const app4 = {
          build_stack: {
            name: 'heroku-16',
          },
          id: '456',
          name: '\u001B[31m超级表格—测试\u001B[0m',
          web_url: 'https://supertable-test-1.herokuapp.com/',
        }
        /* eslint-enable camelcase */

        ux.table([...apps, app4 as any], {name: {}}, {'no-header': true})
        expect(output.stdout).to.equal(` super…${ws}
 super…${ws}
 \u001B[31m超级\u001B[39m…${ws}${ws}\n`)
      })
  })
})
