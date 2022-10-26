import {Parser} from './parse'
import {FlagInput, Input, ParserOutput, OutputFlags, OutputArgs} from '../interfaces'
import {validate} from './validate'
import {FlagArgInput} from '../interfaces/parser'
export {flagUsages} from './help'

export async function parse<
  TFlags extends OutputFlags<any>,
  BFlags extends OutputFlags<any>,
  TArgs extends OutputArgs,
  AFlags extends OutputFlags<any>
>(argv: string[], options: Input<TFlags, BFlags, AFlags>): Promise<ParserOutput<TFlags, BFlags, TArgs, AFlags>> {
  const input = {
    argv,
    context: options.context,
    '--': options['--'],
    flags: (options.flags ?? {}) as FlagInput<any>,
    flagArgs: (options.flagArgs ?? {}) as FlagArgInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await validate({input, output})
  return output as ParserOutput<TFlags, BFlags, TArgs, AFlags>
}

