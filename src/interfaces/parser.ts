import {AlphabetLowercase, AlphabetUppercase} from './alphabet'
import {Config} from './config'

export type ParseFn<T> = (input: string) => Promise<T>

export interface Arg<T = string> {
  name: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  parse?: ParseFn<T>;
  default?: T | (() => T);
  options?: string[];
  ignoreStdin?: boolean;
}

export interface ArgBase<T> {
  name?: string;
  description?: string;
  hidden?: boolean;
  parse: ParseFn<T>;
  default?: T | (() => Promise<T>);
  input?: string;
  options?: string[];
  ignoreStdin?: boolean;
}

export type RequiredArg<T> = ArgBase<T> & {
  required: true;
  value: T;
}

export type OptionalArg<T> = ArgBase<T> & {
  required: false;
  value?: T;
}

export type ParserArg<T> = RequiredArg<T> | OptionalArg<T>

export interface FlagOutput { [name: string]: any }
export type ArgInput = Arg<any>[]

export interface CLIParseErrorOptions {
  parse: {
    input?: ParserInput;
    output?: ParserOutput<any, any>;
  };
}

export type OutputArgs<T extends ParserInput['args']> = { [P in keyof T]: any }
export type OutputFlags<T extends ParserInput['flags']> = { [P in keyof T]: any }
export type ParserOutput<TFlags extends OutputFlags<any>, TArgs extends OutputArgs<any>> = {
  flags: TFlags & { json: boolean };
  args: TArgs;
  argv: string[];
  raw: ParsingToken[];
  metadata: Metadata;
}

export type ArgToken = { type: 'arg'; input: string }
export type FlagToken = { type: 'flag'; flag: string; input: string }
export type ParsingToken = ArgToken | FlagToken

export interface FlagUsageOptions { displayRequired?: boolean }

export type Metadata = {
  flags: { [key: string]: MetadataFlag };
}

type MetadataFlag = {
  setFromDefault?: boolean;
}

export type ListItem = [string, string | undefined]
export type List = ListItem[]

export type DefaultContext<T> = {
  options: OptionFlag<T>;
  flags: { [k: string]: string };
}

export type Default<T> = T | ((context: DefaultContext<T>) => Promise<T>)

export type FlagBase<T, I> = {
  name: string;
  char?: AlphabetLowercase | AlphabetUppercase;
  description?: string;
  helpLabel?: string;
  hidden?: boolean;
  required?: boolean;
  dependsOn?: string[];
  exclusive?: string[];
  exactlyOne?: string[];
  /**
   * also accept an environment variable as input
   */
  env?: string;
  parse(input: I, context: any): Promise<T>;
}

export type BooleanFlag<T> = FlagBase<T, boolean> & {
  type: 'boolean';
  allowNo: boolean;
  /**
   * specifying a default of false is the same not specifying a default
   */
  default?: Default<boolean>;
}

export type OptionFlag<T> = FlagBase<T, string> & {
  type: 'option';
  helpValue?: string;
  default?: Default<T | undefined>;
  multiple: boolean;
  input: string[];
  options?: string[];
}

export type Definition<T> = {
  (options: { multiple: true } & Partial<OptionFlag<T[]>>): OptionFlag<T[]>;
  (
    options: ({ required: true } | { default: Default<T> }) &
      Partial<OptionFlag<T>>,
  ): OptionFlag<T>;
  (options?: Partial<OptionFlag<T>>): OptionFlag<T | undefined>;
}

export type EnumFlagOptions<T> = Partial<OptionFlag<T>> & {
  options: T[];
}

export type Flag<T> = BooleanFlag<T> | OptionFlag<T>

export type Input<TFlags extends FlagOutput> = {
  flags?: FlagInput<TFlags>;
  args?: ArgInput;
  strict?: boolean;
  context?: any;
  '--'?: boolean;
}

export interface ParserInput {
  argv: string[];
  flags: FlagInput<any>;
  args: ParserArg<any>[];
  strict: boolean;
  context: any;
  '--'?: boolean;
}

export type CompletionContext = {
  args?: { [name: string]: string };
  flags?: { [name: string]: string };
  argv?: string[];
  config: Config;
}

export type Completion = {
  skipCache?: boolean;
  cacheDuration?: number;
  cacheKey?(ctx: CompletionContext): Promise<string>;
  options(ctx: CompletionContext): Promise<string[]>;
}

export type CompletableOptionFlag<T> = OptionFlag<T> & {
  completion?: Completion;
}

export type CompletableFlag<T> = BooleanFlag<T> | CompletableOptionFlag<T>

export type FlagInput<T extends FlagOutput> = { [P in keyof T]: CompletableFlag<T[P]> }
