import {Command} from '../command'
import {AlphabetLowercase, AlphabetUppercase} from './alphabet'
import {Config} from './config'

export type FlagOutput = { [name: string]: any }
export type ArgOutput = { [name: string]: any }

export type CLIParseErrorOptions = {
  parse: {
    input?: ParserInput;
    output?: ParserOutput;
  };
}

export type OutputArgs<T extends ParserInput['args']> = { [P in keyof T]: any }
export type OutputFlags<T extends ParserInput['flags']> = { [P in keyof T]: any }

export type ParserOutput<
  TFlags extends OutputFlags<any> = any,
  BFlags extends OutputFlags<any> = any,
  TArgs extends OutputFlags<any> = any
> = {
  // Add in the --json flag so that it shows up in the types.
  // This is necessary because there's no way to optionally add the json flag based
  // on wether enableJsonFlag is set in the command.
  flags: TFlags & BFlags & { json: boolean | undefined };
  args: TArgs;
  argv: unknown[];
  raw: ParsingToken[];
  metadata: Metadata;
  nonExistentFlags: string[];
}

export type ArgToken = { type: 'arg'; arg: string; input: string }
export type FlagToken = { type: 'flag'; flag: string; input: string }
export type ParsingToken = ArgToken | FlagToken

export type FlagUsageOptions = { displayRequired?: boolean }

export type Metadata = {
  flags: { [key: string]: MetadataFlag };
}

type MetadataFlag = {
  setFromDefault?: boolean;
}

export type ListItem = [string, string | undefined]
export type List = ListItem[]

export type CustomOptions = Record<string, unknown>

export type DefaultContext<T> = {
  options: T;
  flags: Record<string, string>;
}

export type FlagDefault<T, P = CustomOptions> = T | ((context: DefaultContext<OptionFlag<T, P>>) => Promise<T>)
export type FlagDefaultHelp<T, P = CustomOptions> = T | ((context: DefaultContext<OptionFlag<T, P>>) => Promise<string | undefined>)

export type ArgDefault<T, P = CustomOptions> = T | ((context: DefaultContext<Arg<T, P>>) => Promise<T>)
export type ArgDefaultHelp<T, P = CustomOptions> = T | ((context: DefaultContext<Arg<T, P>>) => Promise<string | undefined>)

export type FlagRelationship = string | {name: string; when: (flags: Record<string, unknown>) => Promise<boolean>};
export type Relationship = {
  type: 'all' | 'some' | 'none';
  flags: FlagRelationship[];
}

export type Deprecation = {
  to?: string;
  message?: string;
  version?: string;
}

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
  /**
   * Accept an environment variable as input
   */
  env?: string;
  /**
   * If true, the flag will not be shown in the help.
   */
  hidden?: boolean;
  /**
   * If true, the flag will be required.
   */
  required?: boolean;
  /**
   * List of flags that this flag depends on.
   */
  dependsOn?: string[];
  /**
   * List of flags that cannot be used with this flag.
   */
  exclusive?: string[];
  /**
   * Exactly one of these flags must be provided.
   */
  exactlyOne?: string[];
  /**
   * Define complex relationships between flags.
   */
  relationships?: Relationship[];
  /**
   * Make the flag as deprecated.
   */
  deprecated?: true | Deprecation;
  /**
   * Alternate names that can be used for this flag.
   */
  aliases?: string[];
}

export type ArgProps = {
  name: string;
  /**
   * A description of flag usage. If summary is provided, the description
   * is assumed to be a longer description and will be shown in a separate
   * section within help.
   */
  description?: string;
  /**
   * If true, the flag will not be shown in the help.
   */
  hidden?: boolean;
  /**
   * If true, the flag will be required.
   */
  required?: boolean;

  options?: string[];
  ignoreStdin?: boolean;
}

export type BooleanFlagProps = FlagProps & {
  type: 'boolean';
  allowNo: boolean;
}

export type OptionFlagProps = FlagProps & {
  type: 'option';
  helpValue?: string;
  options?: string[];
  multiple?: boolean;
}

export type FlagParser<T, I extends string | boolean, P = CustomOptions> = (input: I, context: Command, opts: P & OptionFlag<T, P>) => Promise<T>

export type ArgParser<T, P = CustomOptions> = (input: string, context: Command, opts: P & Arg<T, P>) => Promise<T>

export type Arg<T, P = CustomOptions> = ArgProps & {
  options?: T[];
  defaultHelp?: ArgDefaultHelp<T>;
  input: string[];
  default?: ArgDefault<T | undefined>;
  parse: ArgParser<T, P>;
}

export type ArgDefinition<T, P = CustomOptions> = {
  (options: P & ({ required: true } | { default: ArgDefault<T> }) & Partial<Arg<T, P>>): Arg<T, P>;
  (options?: P & Partial<Arg<T, P>>): Arg<T | undefined, P>;
}

export type BooleanFlag<T> = FlagProps & BooleanFlagProps & {
  /**
   * specifying a default of false is the same as not specifying a default
   */
   default?: FlagDefault<boolean>;
   parse: (input: boolean, context: Command, opts: BooleanFlag<T>) => Promise<T>
}

export type CustomOptionFlag<T, P = any, M = false> = FlagProps & OptionFlagProps & {
  parse: (input: string, context: Command, opts: P & CustomOptionFlag<T, P>) => Promise<T>
  defaultHelp?: FlagDefaultHelp<T>;
  input: string[];
  default?: M extends true ? FlagDefault<T[] | undefined, P> : FlagDefault<T | undefined, P>;
}

export type OptionFlag<T, P = Record<string, unknown>> = FlagProps & OptionFlagProps & {
  parse: (input: string, context: Command, opts: P & OptionFlag<T, P>) => Promise<T>
  defaultHelp?: FlagDefaultHelp<T, P>;
  input: string[];
} & ({
  default?: FlagDefault<T | undefined, P>;
  multiple: false;
} | {
  default?: FlagDefault<T[] | undefined, P>;
  multiple: true;
})

export type FlagDefinition<T, P = Record<string, unknown>> = {
  (
    options: P & { multiple: true } & ({ required: true } | { default: FlagDefault<T[]> }) & Partial<OptionFlag<T, P>>
  ): OptionFlag<T[]>;
  (options: P & { multiple: true } & Partial<OptionFlag<T>>): OptionFlag<T[] | undefined, P>;
  (options: P & ({ required: true } | { default: FlagDefault<T> }) & Partial<OptionFlag<T>>): OptionFlag<T, P>;
  (options?: P & Partial<OptionFlag<T>>): OptionFlag<T | undefined, P>;
}

export type Flag<T> = BooleanFlag<T> | OptionFlag<T>

export type Input<TFlags extends FlagOutput, BFlags extends FlagOutput, AFlags extends ArgOutput> = {
  flags?: FlagInput<TFlags>;
  baseFlags?: FlagInput<BFlags>;
  args?: ArgInput<AFlags>;
  strict?: boolean;
  context?: Command;
  '--'?: boolean;
}

export type ParserInput = {
  argv: string[];
  flags: FlagInput<any>;
  args: ArgInput<any>;
  strict: boolean;
  context: Command | undefined;
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

export type FlagInput<T extends FlagOutput = { [flag: string]: any }> = { [P in keyof T]: CompletableFlag<T[P]> }

export type ArgInput<T extends ArgOutput = { [arg: string]: any }> = { [P in keyof T]: Arg<T[P]> }
