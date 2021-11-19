import {CLIError} from '../errors'

import Deps from './deps'
import * as Help from './help'
import * as List from './list'
import {ParserArg, CLIParseErrorOptions, OptionFlag, Flag} from '../interfaces'

export {CLIError} from '../errors'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('help', () => require('./help') as typeof Help)
// eslint-disable-next-line node/no-missing-require
.add('list', () => require('./list') as typeof List)

export class CLIParseError extends CLIError {
  public parse: CLIParseErrorOptions['parse']

  constructor(options: CLIParseErrorOptions & { message: string }) {
    options.message += '\nSee more help with --help'
    super(options.message)
    this.parse = options.parse
  }
}

export class InvalidArgsSpecError extends CLIParseError {
  public args: ParserArg<any>[]

  constructor({args, parse}: CLIParseErrorOptions & { args: ParserArg<any>[] }) {
    let message = 'Invalid argument spec'
    const namedArgs = args.filter(a => a.name)
    if (namedArgs.length > 0) {
      const list = m.list.renderList(namedArgs.map(a => [`${a.name} (${a.required ? 'required' : 'optional'})`, a.description] as [string, string]))
      message += `:\n${list}`
    }

    super({parse, message})
    this.args = args
  }
}

export class RequiredArgsError extends CLIParseError {
  public args: ParserArg<any>[]

  constructor({args, parse}: CLIParseErrorOptions & { args: ParserArg<any>[] }) {
    let message = `Missing ${args.length} required arg${args.length === 1 ? '' : 's'}`
    const namedArgs = args.filter(a => a.name)
    if (namedArgs.length > 0) {
      const list = m.list.renderList(namedArgs.map(a => [a.name, a.description] as [string, string]))
      message += `:\n${list}`
    }

    super({parse, message})
    this.args = args
  }
}

export class RequiredFlagError extends CLIParseError {
  public flag: Flag<any>

  constructor({flag, parse}: CLIParseErrorOptions & { flag: Flag<any> }) {
    const usage = m.list.renderList(m.help.flagUsages([flag], {displayRequired: false}))
    const message = `Missing required flag:\n${usage}`
    super({parse, message})
    this.flag = flag
  }
}

export class UnexpectedArgsError extends CLIParseError {
  public args: string[]

  constructor({parse, args}: CLIParseErrorOptions & { args: string[] }) {
    const message = `Unexpected argument${args.length === 1 ? '' : 's'}: ${args.join(', ')}`
    super({parse, message})
    this.args = args
  }
}

export class FlagInvalidOptionError extends CLIParseError {
  constructor(flag: OptionFlag<any>, input: string) {
    const message = `Expected --${flag.name}=${input} to be one of: ${flag.options!.join(', ')}`
    super({parse: {}, message})
  }
}

export class ArgInvalidOptionError extends CLIParseError {
  constructor(arg: ParserArg<any>, input: string) {
    const message = `Expected ${input} to be one of: ${arg.options!.join(', ')}`
    super({parse: {}, message})
  }
}
