// tslint:disable interface-over-type-literal

import * as args from './args'
import Deps from './deps'
import * as flags from './flags'
import {OutputArgs, OutputFlags, Parser, ParserOutput as Output} from './parse'
import * as Validate from './validate'
export {args}
export {flags}
export {flagUsages} from './help'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('validate', () => require('./validate').validate as typeof Validate.validate)

export type Input<TFlags extends flags.Output> = {
  flags?: flags.Input<TFlags>;
  args?: args.Input;
  strict?: boolean;
  context?: any;
  '--'?: boolean;
}

export function parse<TFlags, TArgs extends {[name: string]: string}>(argv: string[], options: Input<TFlags>): Output<TFlags, TArgs> {
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
  const output = parser.parse()
  m.validate({input, output})
  return output as any
}

export {OutputFlags, OutputArgs, Output}
