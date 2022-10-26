import {Command} from '../command'
import {AlphabetLowercase, AlphabetUppercase} from './alphabet'
import {Config} from './config'

export type ParseFn<T> = (input: string) => Promise<T>

// export type FlagArgProps<T> = {
//   /**
//    * A description of flag usage. If summary is provided, the description
//    * is assumed to be a longer description and will be shown in a separate
//    * section within help.
//    */
//   description?: string;
//   /**
//    * If true, the flag will not be shown in the help.
//    */
//   hidden?: boolean;
//   /**
//    * If true, the flag will be required.
//    */
//   required?: boolean;
//   /**
//    * Order in which the arg should be parsed.
//    */
//   order: number;
//   parse?: ParseFn<T>;
//   default?: T | (() => T);
// }

export type Arg<T = string> = {
  // TODO: remove
  name: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  parse?: ParseFn<T>;
  default?: T | (() => T);
  options?: string[];
  ignoreStdin?: boolean;
}

export type ArgBase<T> = {
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

export type FlagOutput = { [name: string]: any }
export type FlagArgOutput = { [name: string]: any }
export type ArgOutput = { [name: string]: any }
export type ArgInput = { [arg: string]: Arg<unknown> }

export interface CLIParseErrorOptions {
  parse: {
    input?: ParserInput;
    output?: ParserOutput;
  };
}

export type OutputArgs = { [name: string]: any }
export type OutputFlags<T extends ParserInput['flags']> = { [P in keyof T]: any }

export type ParserOutput<
  TFlags extends OutputFlags<any> = any,
  BFlags extends OutputFlags<any> = any,
  TArgs extends OutputArgs = any,
  AFlags extends OutputFlags<any> = any
> = {
  // Add in the --json flag so that it shows up in the types.
  // This is necessary because there's no way to optionally add the json flag based
  // on wether enableJsonFlag is set in the command.
  flags: TFlags & BFlags & { json: boolean | undefined };
  flagArgs: AFlags;
  args: TArgs;
  argv: string[];
  raw: ParsingToken[];
  metadata: Metadata;
}

export type ArgToken = { type: 'arg'; arg: string; input: string }
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

export type DefaultContext<T, P> = {
  options: P & OptionFlag<T>;
  flags: Record<string, string>;
}

export type Default<T, P = Record<string, unknown>> = T | ((context: DefaultContext<T, P>) => Promise<T>)
export type DefaultHelp<T, P = Record<string, unknown>> = T | ((context: DefaultContext<T, P>) => Promise<string | undefined>)

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

export type FlagArgProps = {
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

export type BooleanFlagArgProps = FlagArgProps & {
  type: 'boolean';
  // TODO: delete?
  options?: boolean[];
}

export type OptionFlagProps = FlagProps & {
  type: 'option';
  helpValue?: string;
  options?: string[];
  multiple?: boolean;
}

export type OptionFlagArgProps = FlagArgProps & {
  type: 'option';
  options?: string[];
}

export type FlagParser<T, I, P = any> = (input: I, context: Command, opts: P & OptionFlag<T>) => Promise<T>
export type FlagArgParser<T, P = any> = (input: string, context: Command, opts: P & OptionFlagArg<T>) => Promise<T>

export type FlagBase<T, I, P = any> = FlagProps & {
  parse: FlagParser<T, I, P>;
}

export type FlagArgBase<T, P = any> = FlagArgProps & {
  parse: FlagArgParser<T, P>;
}

export type BooleanFlag<T> = FlagBase<T, boolean> & BooleanFlagProps & {
  /**
   * specifying a default of false is the same as not specifying a default
   */
   default?: Default<boolean>;
}

export type BooleanFlagArg<T> = FlagArgBase<T> & BooleanFlagArgProps & {
  /**
   * specifying a default of false is the same as not specifying a default
   */
   default?: Default<boolean>;
}

export type CustomOptionFlag<T, P = any, M = false> = FlagBase<T, string, P> & OptionFlagProps & {
  defaultHelp?: DefaultHelp<T>;
  input: string[];
  default?: M extends true ? Default<T[] | undefined, P> : Default<T | undefined, P>;
}

export type OptionFlag<T> = FlagBase<T, string> & OptionFlagProps & {
  defaultHelp?: DefaultHelp<T>;
  input: string[];
} & ({
  default?: Default<T | undefined>;
  multiple: false;
} | {
  default?: Default<T[] | undefined>;
  multiple: true;
})

export type OptionFlagArg<T> = FlagArgBase<T> & OptionFlagArgProps & {
  defaultHelp?: DefaultHelp<T>;
  input: string[];
} & ({
  default?: Default<T | undefined>;
  multiple: false;
} | {
  default?: Default<T[] | undefined>;
  multiple: true;
})

export type Definition<T, P = Record<string, unknown>> = {
  (
    options: P & { multiple: true } & ({ required: true } | { default: Default<T[]> }) & Partial<OptionFlag<T>>
  ): OptionFlag<T[]>;
  (options: P & { multiple: true } & Partial<OptionFlag<T>>): OptionFlag<T[] | undefined>;
  (options: P & ({ required: true } | { default: Default<T> }) & Partial<OptionFlag<T>>): OptionFlag<T>;
  (options?: P & Partial<OptionFlag<T>>): OptionFlag<T | undefined>;
}

export type DefinitionArg<T, P = Record<string, unknown>> = {
  (
    options: P & { multiple: true } & ({ required: true } | { default: Default<T[]> }) & Partial<OptionFlagArg<T>>
  ): OptionFlagArg<T[]>;
  (options: P & { multiple: true } & Partial<OptionFlagArg<T>>): OptionFlagArg<T[] | undefined>;
  (options: P & ({ required: true } | { default: Default<T> }) & Partial<OptionFlagArg<T>>): OptionFlagArg<T>;
  (options?: P & Partial<OptionFlagArg<T>>): OptionFlagArg<T | undefined>;
}

export type EnumFlagOptions<T, M = false> = Partial<CustomOptionFlag<T, any, M>> & {
  options: T[];
} & ({
  default?: Default<T | undefined>;
  multiple?: false;
} | {
  default?: Default<T[] | undefined>;
  multiple: true;
})

export type EnumFlagArgOptions<T> = Partial<OptionFlagArg<T>> & {
  options: T[];
} & ({
  default?: Default<T | undefined>;
  multiple?: false;
} | {
  default?: Default<T[] | undefined>;
  multiple: true;
})

export type Flag<T> = BooleanFlag<T> | OptionFlag<T>

export type Input<TFlags extends FlagOutput, BFlags extends FlagOutput, AFlags extends FlagArgOutput> = {
  flags?: FlagInput<TFlags>;
  baseFlags?: FlagInput<BFlags>;
  // args?: ArgInput;
  flagArgs?: FlagArgInput<AFlags>;
  strict?: boolean;
  context?: Command;
  '--'?: boolean;
}

export interface ParserInput {
  argv: string[];
  flags: FlagInput<any>;
  // args: ParserArg<any>[];
  flagArgs: FlagArgInput<any>;
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

export type FlagArg<T> = OptionFlagArg<T> | BooleanFlagArg<T>

export type FlagArgInput<T extends FlagArgOutput = { [arg: string]: any }> = { [P in keyof T]: FlagArg<T[P]> }
