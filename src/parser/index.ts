import type {ArgInput, FlagInput, Input, OutputArgs, OutputFlags, ParserOutput} from '../interfaces/parser'

import {Parser} from './parse'
import {validate} from './validate'

export type {ArgInput, FlagInput, Input, OutputArgs, OutputFlags, ParserOutput} from '../interfaces/parser'

export {flagUsages} from './help'
export {validate} from './validate'

export async function parse<
  TFlags extends OutputFlags<any>,
  BFlags extends OutputFlags<any>,
  TArgs extends OutputArgs<any>,
>(argv: string[], options: Input<TFlags, BFlags, TArgs>): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
  const input = {
    '--': options['--'],
    args: (options.args ?? {}) as ArgInput<any>,
    argv,
    context: options.context,
    flags: (options.flags ?? {}) as FlagInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await validate({input, output})
  return output as ParserOutput<TFlags, BFlags, TArgs>
}
