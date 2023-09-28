import {ArgInput, FlagInput, Input, OutputArgs, OutputFlags, ParserOutput} from '../interfaces/parser'
import {Parser} from './parse'
import {validate} from './validate'

export {flagUsages} from './help'

export async function parse<
  TFlags extends OutputFlags<any>,
  BFlags extends OutputFlags<any>,
  TArgs extends OutputArgs<any>,
>(argv: string[], options: Input<TFlags, BFlags, TArgs>): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
  const input = {
    argv,
    context: options.context,
    '--': options['--'],
    flags: (options.flags ?? {}) as FlagInput<any>,
    args: (options.args ?? {}) as ArgInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await validate({input, output})
  return output as ParserOutput<TFlags, BFlags, TArgs>
}
