export type ParseFn<T> = (input: string) => T

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IArg<T = string> {
  name: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  parse?: ParseFn<T>;
  default?: T | (() => T);
  options?: string[];
}

export interface ArgBase<T> {
  name?: string;
  description?: string;
  hidden?: boolean;
  parse: ParseFn<T>;
  default?: T | (() => T);
  input?: string;
  options?: string[];
}

export type RequiredArg<T> = ArgBase<T> & {
  required: true;
  value: T;
}

export type OptionalArg<T> = ArgBase<T> & {
  required: false;
  value?: T;
}

export type Arg<T> = RequiredArg<T> | OptionalArg<T>

export function newArg<T>(arg: IArg<T> & { Parse: ParseFn<T> }): Arg<T>
export function newArg(arg: IArg): Arg<string>
export function newArg(arg: IArg<any>): any {
  return {
    parse: (i: string) => i,
    ...arg,
    required: Boolean(arg.required),
  }
}

export interface Output {[name: string]: any}
export type Input = IArg<any>[]
