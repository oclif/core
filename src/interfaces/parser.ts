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

export type OutputArgs = { [name: string]: any }
export type OutputFlags<T extends ParserInput['flags']> = { [P in keyof T]: any }
export type ParserOutput<TFlags extends OutputFlags<any>, TArgs extends OutputArgs> = {
  // Add in global flags so that they show up in the types
  // This is necessary because there's no easy way to optionally return
  // the individual flags based on wether they're enabled or not
  flags: TFlags & { json: boolean | undefined };
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

export type FlagProps = {
  name: string;
  char?: AlphabetLowercase | AlphabetUppercase;
  /**
   * A short summary of flag usage to show in the flag list.
   * If not provided, description will be used.
   */
  summary?: string;
  /**
   * A description of flag usage. If summary is provided, the description
   * is assumed to be a longer description and will be shown in a separate
   * section within help.
   */
  description?: string;
  /**
   * The flag label to show in help. Defaults to "[-<char>] --<name>" where -<char> is
   * only displayed if the char is defined.
   */
  helpLabel?: string;
  /**
   * Shows this flag in a separate list in the help.
   */
  helpGroup?: string;
  hidden?: boolean;
  required?: boolean;
  dependsOn?: string[];
  exclusive?: string[];
}

export type BooleanFlagProps = FlagProps & {
  type: 'boolean';
  allowNo: boolean;
}

export type OptionFlagProps = FlagProps & {
  type: 'option';
  helpValue?: string;
  options?: string[];
  multiple: boolean;
}

export type FlagBase<T, I> = FlagProps & {
  exactlyOne?: string[];
  /**
   * also accept an environment variable as input
   */
  env?: string;
  parse(input: I, context: any): Promise<T>;
}

export type BooleanFlag<T> = FlagBase<T, boolean> & BooleanFlagProps & {
  /**
   * specifying a default of false is the same not specifying a default
   */
   default?: Default<boolean>;
}
export type OptionFlag<T> = FlagBase<T, string> & OptionFlagProps & {
  default?: Default<T | undefined>;
  input: string[];
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
