## UX

The `ux` module provides a small number of tools that will help you create a user experience for your CLI. If you need to create a more complex user experience, we suggest the following libraries:

- For prompts: [inquirer](https://www.npmjs.com/package/inquirer)
- For spinners: [ora](https://www.npmjs.com/package/ora)
- For progress bars: [cli-progress](https://www.npmjs.com/package/cli-progress)
- For tables: [tty-table](https://www.npmjs.com/package/tty-table), [cliui](https://www.npmjs.com/package/cliui)
- For trees: [object-treeify](https://www.npmjs.com/package/object-treeify)
- For colored JSON: [color-json](https://www.npmjs.com/package/color-json)
- For notifications: [node-notifier](https://www.npmjs.com/package/node-notifier)
- For links: [terminal-link](https://www.npmjs.com/package/terminal-link)
- For rendering react components: [ink](https://www.npmjs.com/package/ink)

### `action`

`action` is an abstraction for a spinner that automatically detects if the current environment is a TTY or not.

```typescript
import {action} from '@oclif/core/ux'

action.start('Starting process')
action.status = 'Process still in progress'
action.pauseAsync(async () => {
  // pause spinner while you execute an asynchronous function
})
action.stop()
```

### `colorize`

Add color to text. The provided color can be a hex code, rgb string, or standard ANSI color.

```typescript
import {colorize, stdout} from '@oclif/core/ux'

stdout(colorize('#00FFFF', 'hello world'))
stdout(colorize('rgb(0, 255, 255)', 'hello world'))
stdout(colorize('cyan', 'hello world'))
```

### `colorizeJson`

Add color to JSON. The provided theme can consist of hex codes, rgb strings, or standard ANSI colors.

```typescript
import {colorizeJson, stdout} from '@oclif/core/ux'

const json = {
  number: 5,
  string: 'five',
  null: null,
  array: [1, 2, 3],
  object: {
    number: 5,
    string: 'five',
    null: null,
    array: [1, 2, 3],
  },
}

const theme = {
  brace: '#00FFFF',
  bracket: 'rgb(0, 255, 255)',
  colon: 'dim',
  comma: 'yellow',
  key: 'bold',
  string: 'green',
  number: 'blue',
  boolean: 'cyan',
  null: 'redBright',
}

stdout(colorizeJson(json, {theme}))
stdout(colorizeJson(json, {theme}))
stdout(colorizeJson(json, {theme}))
```

### `error`

Throw a standardized error

```typescript
import {error} from '@oclif/core/ux'

// throw with a string and exit with default code (2)
error('Invalid input')
// throw with an Error and exit with default code (2)
error(new Error('Invalid input'))
// log error to stderr but don't exit
error('Invalid input', {exit: false})
// exit with specific code
error('Invalid input', {exit: 999})
```

### `stderr`

Log a formatted string to stderr

```typescript
import {stderr} from '@oclif/core/ux'

// log "hello world" to stderr
stderr('hello %s', 'world')
```

### `stderr`

Log a formatted string to stdout

```typescript
import {stdout} from '@oclif/core/ux'

// log "hello world" to stdout
stdout('hello %s', 'world')
```

### `warn`

Print a warning message to stderr. Input can be a string or `Error`

```typescript
import {warn} from '@oclif/core/ux'

warn('This is a warning.')
warn(new Error('This is a warning.'))
```
