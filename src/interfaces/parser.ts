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

export type MetadataFlag = {
  setFromDefault?: boolean;
  defaultHelp?: unknown;
}

export type ListItem = [string, string | undefined]
export type List = ListItem[]

export type CustomOptions = Record<string, unknown>

export type DefaultContext<T> = {
  options: T;
  flags: Record<string, string>;
}

/**
 * Type to define a default value for a flag.
 * @param context The context of the flag.
 */
export type FlagDefault<T, P = CustomOptions> = T | ((context: DefaultContext<P & OptionFlag<T, P>>) => Promise<T>)

/**
 * Type to define a defaultHelp value for a flag.
 * The defaultHelp value is used in the help output for the flag and when writing a manifest.
 * It is also can be used to provide a value for the flag when issuing certain error messages.
 *
 * @param context The context of the flag.
 */
export type FlagDefaultHelp<T, P = CustomOptions> = T | ((context: DefaultContext<P & OptionFlag<T, P>>) => Promise<string | undefined>)

/**
 * Type to define a default value for an arg.
 * @param context The context of the arg.
 */
export type ArgDefault<T, P = CustomOptions> = T | ((context: DefaultContext<Arg<T, P>>) => Promise<T>)

/**
 * Type to define a defaultHelp value for an arg.
 * @param context The context of the arg.
 */
export type ArgDefaultHelp<T, P = CustomOptions> = T | ((context: DefaultContext<Arg<T, P>>) => Promise<string | undefined>)

export type FlagRelationship = string | {name: string; when: (flags: Record<string, unknown>) => Promise<boolean>};
export type Relationship = {
  type: 'all' | 'some' | 'none';
  flags: FlagRelationship[];
}

export type Deprecation = {
  to?: string;
  message?: string;
  version?: string | number;
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
  /**
   * Emit deprecation warning when a flag alias is provided
   */
  deprecateAliases?: boolean
  /**
   * Delimiter to separate the values for a multiple value flag.
   * Only respected if multiple is set to true. Default behavior is to
   * separate on spaces.
   */
  delimiter?: ',',
  /**
   * If true, the value returned by defaultHelp will not be cached in the oclif.manifest.json.
   * This is helpful if the default value contains sensitive data that shouldn't be published to npm.
   */
  noCacheDefault?: boolean;
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
  /**
   * If true, the value returned by defaultHelp will not be cached in the oclif.manifest.json.
   * This is helpful if the default value contains sensitive data that shouldn't be published to npm.
   */
  noCacheDefault?: boolean;
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

export type FlagParserContext = Command & {token: FlagToken}

export type FlagParser<T, I extends string | boolean, P = CustomOptions> = (input: I, context: FlagParserContext, opts: P & OptionFlag<T, P>) => Promise<T>

export type ArgParserContext = Command & {token: ArgToken}

export type ArgParser<T, P = CustomOptions> = (input: string, context: ArgParserContext, opts: P & Arg<T, P>) => Promise<T>

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
  parse: (input: boolean, context: FlagParserContext, opts: FlagProps & BooleanFlagProps) => Promise<T>
}

export type OptionFlagDefaults<T, P = CustomOptions, M = false> = FlagProps & OptionFlagProps & {
  parse: FlagParser<T, string, P>
  defaultHelp?: FlagDefaultHelp<T>;
  input: string[];
  default?: M extends true ? FlagDefault<T[] | undefined, P> : FlagDefault<T | undefined, P>;
}

export type OptionFlag<T, P = CustomOptions> = FlagProps & OptionFlagProps & {
  parse: FlagParser<T, string, P>
  defaultHelp?: FlagDefaultHelp<T, P>;
  input: string[];
} & ({
  default?: FlagDefault<T | undefined, P>;
  multiple: false;
} | {
  default?: FlagDefault<T[] | undefined, P>;
  multiple: true;
})

export type FlagDefinition<T, P = CustomOptions> = {
  (
    options: P & { multiple: true } & ({ required: true } | { default: FlagDefault<T[]> }) & Partial<OptionFlag<T, P>>
  ): OptionFlag<T[]>;
  (options: P & { multiple: true } & Partial<OptionFlag<T>>): OptionFlag<T[] | undefined>;
  (options: P & ({ required: true } | { default: FlagDefault<T> }) & Partial<OptionFlag<T>>): OptionFlag<T>;
  (options?: P & Partial<OptionFlag<T>>): OptionFlag<T | undefined>;
}

export type Flag<T> = BooleanFlag<T> | OptionFlag<T>

export type Input<TFlags extends FlagOutput, BFlags extends FlagOutput, AFlags extends ArgOutput> = {
  flags?: FlagInput<TFlags>;
  baseFlags?: FlagInput<BFlags>;
  args?: ArgInput<AFlags>;
  strict?: boolean;
  context?: ParserContext;
  '--'?: boolean;
}

export type ParserInput = {
  argv: string[];
  flags: FlagInput<any>;
  args: ArgInput<any>;
  strict: boolean;
  context: ParserContext | undefined;
  '--'?: boolean;
}

export type ParserContext = Command & {
  token?: FlagToken | ArgToken;
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
