# How to migrate from the `cli-ux` module and use the `ux` components now contained in `@oclif/core`

We've retained the capabilities of `cli-ux` in `@oclif/core`, but we've reorganized the code to expose the exported members via a namespace.
We've removed the exported member `cli`, because it's equivalent to the exported member `ux`.
Updating your project to use cli IO utilities should be straight forward.

1. Remove the `cli-ux` dependency.
1. Change all imports that reference `cli-ux` to `@oclif/core`.
1. Add the namespace member `CliUx` to your `@oclif/core` import.
1. Preface previous `cli-ux` members with the namespace `CliUx`.
1. Replace all references to member `cli` with `ux`.

cli-ux
======

cli IO utilities

# Usage

The following example assumes you've installed `@oclif/core` to your project with `npm install @oclif/core` or `yarn add @oclif/core` and have it required in your script (TypeScript example):

```typescript
import {CliUx} from '@oclif/core'
CliUx.ux.prompt('What is your name?')
```

JavaScript:

```javascript
const {CliUx} = require('@oclif/core')

CliUx.ux.prompt('What is your name?')
```

# CliUx.ux.prompt()

Prompt for user input.

```typescript
// just prompt for input
await CliUx.ux.prompt('What is your name?')

// mask input after enter is pressed
await CliUx.ux.prompt('What is your two-factor token?', {type: 'mask'})

// mask input on keypress (before enter is pressed)
await CliUx.ux.prompt('What is your password?', {type: 'hide'})

// yes/no confirmation
await CliUx.ux.confirm('Continue?')

// "press any key to continue"
await CliUx.ux.anykey()
```

![prompt demo](assets/prompt.gif)

# CliUx.ux.url(text, uri)

Create a hyperlink (if supported in the terminal)

```typescript
await CliUx.ux.url('sometext', 'https://google.com')
// shows sometext as a hyperlink in supported terminals
// shows https://google.com in unsupported terminals
```

![url demo](assets/url.gif)

# CliUx.ux.open

Open a url in the browser

```typescript
await CliUx.ux.open('https://oclif.io')
```

# CliUx.ux.action

Shows a spinner

```typescript
// start the spinner
CliUx.ux.action.start('starting a process')
// show on stdout instead of stderr
CliUx.ux.action.start('starting a process', 'initializing', {stdout: true})

// stop the spinner
CliUx.ux.action.stop() // shows 'starting a process... done'
CliUx.ux.action.stop('custom message') // shows 'starting a process... custom message'
```

This degrades gracefully when not connected to a TTY. It queues up any writes to stdout/stderr so they are displayed above the spinner.

![action demo](assets/action.gif)

# CliUx.ux.annotation

Shows an iterm annotation

```typescript
CliUx.ux.annotation('sometext', 'annotated with this text')
```

![annotation demo](assets/annotation.png)

# CliUx.ux.wait

Waits for 1 second or given milliseconds

```typescript
await CliUx.ux.wait()
await CliUx.ux.wait(3000)
```

# CliUx.ux.table

Displays tabular data

```typescript
CliUx.ux.table(data, columns, options)
```

Where:

- `data`: array of data objects to display
- `columns`: [Table.Columns](./src/styled/table.ts)
- `options`: [Table.Options](./src/styled/table.ts)

`CliUx.ux.table.flags()` returns an object containing all the table flags to include in your command.

```typescript
{
  columns: Flags.string({exclusive: ['additional'], description: 'only show provided columns (comma-separated)'}),
  sort: Flags.string({description: 'property to sort by (prepend '-' for descending)'}),
  filter: Flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
  csv: Flags.boolean({exclusive: ['no-truncate'], description: 'output is csv format'}),
  extended: Flags.boolean({char: 'x', description: 'show extra columns'}),
  'no-truncate': Flags.boolean({exclusive: ['csv'], description: 'do not truncate output to fit screen'}),
  'no-header': Flags.boolean({exclusive: ['csv'], description: 'hide table header from output'}),
}
```

Passing `{only: ['columns']}` or `{except: ['columns']}` as an argument into `CliUx.ux.table.flags()` allows or blocks, respectively, those flags from the returned object.

`Table.Columns` defines the table columns and their display options.

```typescript
const columns: CliUx.Table.Columns = {
  // where `.name` is a property of a data object
  name: {}, // "Name" inferred as the column header
  id: {
    header: 'ID', // override column header
    minWidth: '10', // column must display at this width or greater
    extended: true, // only display this column when the --extended flag is present
    get: row => `US-O1-${row.id}`, // custom getter for data row object
  },
}
```

`Table.Options` defines the table options, most of which are the parsed flags from the user for display customization, all of which are optional.

```typescript
const options: CliUx.Table.Options = {
  printLine: myLogger, // custom logger
  columns: flags.columns,
  sort: flags.sort,
  filter: flags.filter,
  csv: flags.csv,
  extended: flags.extended,
  'no-truncate': flags['no-truncate'],
  'no-header': flags['no-header'],
}
```

Example class:

```typescript
import {Command, CliUx} from '@oclif/core'
import axios from 'axios'

export default class Users extends Command {
  static flags = {
    ...CliUx.ux.table.flags()
  }

  async run() {
    const {flags} = this.parse(Users)
    const {data: users} = await axios.get('https://jsonplaceholder.typicode.com/users')

    CliUx.ux.table(users, {
      name: {
        minWidth: 7,
      },
      company: {
        get: row => row.company && row.company.name
      },
      id: {
        header: 'ID',
        extended: true
      }
    }, {
      printLine: this.log,
      ...flags, // parsed flags
    })
  }
}
```

Displays:

```shell
$ example-cli users
Name                     Company
Leanne Graham            Romaguera-Crona
Ervin Howell             Deckow-Crist
Clementine Bauch         Romaguera-Jacobson
Patricia Lebsack         Robel-Corkery
Chelsey Dietrich         Keebler LLC
Mrs. Dennis Schulist     Considine-Lockman
Kurtis Weissnat          Johns Group
Nicholas Runolfsdottir V Abernathy Group
Glenna Reichert          Yost and Sons
Clementina DuBuque       Hoeger LLC

$ example-cli users --extended
Name                     Company            ID
Leanne Graham            Romaguera-Crona    1
Ervin Howell             Deckow-Crist       2
Clementine Bauch         Romaguera-Jacobson 3
Patricia Lebsack         Robel-Corkery      4
Chelsey Dietrich         Keebler LLC        5
Mrs. Dennis Schulist     Considine-Lockman  6
Kurtis Weissnat          Johns Group        7
Nicholas Runolfsdottir V Abernathy Group    8
Glenna Reichert          Yost and Sons      9
Clementina DuBuque       Hoeger LLC         10

$ example-cli users --columns=name
Name
Leanne Graham
Ervin Howell
Clementine Bauch
Patricia Lebsack
Chelsey Dietrich
Mrs. Dennis Schulist
Kurtis Weissnat
Nicholas Runolfsdottir V
Glenna Reichert
Clementina DuBuque

$ example-cli users --filter="company=Group"
Name                     Company
Kurtis Weissnat          Johns Group
Nicholas Runolfsdottir V Abernathy Group

$ example-cli users --sort=company
Name                     Company
Nicholas Runolfsdottir V Abernathy Group
Mrs. Dennis Schulist     Considine-Lockman
Ervin Howell             Deckow-Crist
Clementina DuBuque       Hoeger LLC
Kurtis Weissnat          Johns Group
Chelsey Dietrich         Keebler LLC
Patricia Lebsack         Robel-Corkery
Leanne Graham            Romaguera-Crona
Clementine Bauch         Romaguera-Jacobson
Glenna Reichert          Yost and Sons
```

# CliUx.ux.tree

Generate a tree and display it

```typescript
let tree = CliUx.ux.tree()
tree.insert('foo')
tree.insert('bar')

let subtree = CliUx.ux.tree()
subtree.insert('qux')
tree.nodes.bar.insert('baz', subtree)

tree.display()
```

Outputs:
```shell
├─ foo
└─ bar
   └─ baz
      └─ qux
```

# CliUx.ux.progress

Generate a customizable progress bar and display it

```typescript
const simpleBar = CliUx.ux.progress()
simpleBar.start()

const customBar = CliUx.ux.progress({
                   format: 'PROGRESS | {bar} | {value}/{total} Files',
                   barCompleteChar: '\u2588',
                   barIncompleteChar: '\u2591',
                 })
customBar.start()
```

Outputs:
```shell
bar1:
progress [=====================-------------------] 53% | ETA: 1s | 53/100
bar2:
PROGRESS | █████████████████████████████░░░░░░░░░░░ | 146/204 Files
```

To see a more detailed example, run
```shell script
$ ts-node examples/progress.ts
```

This example extends [cli-progress](https://www.npmjs.com/package/cli-progress).
See the cli-progress module for all the options and the customizations that can be passed in with the options object.
Only the single bar variant of cli-progress is currently supported.


