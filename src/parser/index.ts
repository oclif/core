// tslint:disable interface-over-type-literal

import * as args from './args'
import Deps from './deps'
import * as flags from './flags'
import {Parser} from './parse'
import {Input, ParserOutput} from '../interfaces'
import * as Validate from './validate'
export {args}
export {flags}
export {flagUsages} from './help'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('validate', () => require('./validate').validate as typeof Validate.validate)

export async function parse<TFlags, TArgs extends { [name: string]: string }>(argv: string[], options: Input<TFlags>): Promise<ParserOutput<TFlags, TArgs>> {
  const input = {
    argv,
    context: options.context,
    args: (options.args || []).map((a: any) => args.newArg(a as any)),
    '--': options['--'],
    flags: {
      color: flags.defaultFlags.color,
      ...((options.flags || {})) as any,
    },
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  m.validate({input, output})
  return output as ParserOutput<TFlags, TArgs>
}

const {boolean, integer, url} = flags

export {boolean, integer, url}
