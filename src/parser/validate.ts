import {CLIError} from '../errors'

import {
  InvalidArgsSpecError,
  RequiredArgsError,
  RequiredFlagError,
  UnexpectedArgsError,
} from './errors'
import {ParserArg, ParserInput, ParserOutput, Flag, CompletableFlag} from '../interfaces'

export async function validate(parse: {
  input: ParserInput;
  output: ParserOutput;
}) {
  function validateArgs() {
    const maxArgs = parse.input.args.length
    if (parse.input.strict && parse.output.argv.length > maxArgs) {
      const extras = parse.output.argv.slice(maxArgs)
      throw new UnexpectedArgsError({parse, args: extras})
    }

    const missingRequiredArgs: ParserArg<any>[] = []
    let hasOptional = false

    for (const [index, arg] of parse.input.args.entries()) {
      if (!arg.required) {
        hasOptional = true
      } else if (hasOptional) {
        // (required arg) check whether an optional has occurred before
        // optionals should follow required, not before
        throw new InvalidArgsSpecError({parse, args: parse.input.args})
      }

      if (arg.required && !parse.output.argv[index] && parse.output.argv[index] as any as number !== 0) {
        missingRequiredArgs.push(arg)
      }
    }

    if (missingRequiredArgs.length > 0) {
      throw new RequiredArgsError({parse, args: missingRequiredArgs})
    }
  }

  function validateAcrossFlags(flag: Flag<any>) {
    const intersection = Object.entries(parse.input.flags)
    .map(entry => entry[0]) // array of flag names
    .filter(flagName => parse.output.flags[flagName] !== undefined) // with values
    .filter(flagName => flag.exactlyOne && flag.exactlyOne.includes(flagName)) // and in the exactlyOne list
    if (intersection.length === 0) {
      // the command's exactlyOne may or may not include itself, so we'll use Set to add + de-dupe
      throw new CLIError(`Exactly one of the following must be provided: ${[
        ...new Set(flag.exactlyOne?.map(flag => `--${flag}`)),
      ].join(', ')}`)
    }
  }

  function validateFlags() {
    for (const [name, flag] of Object.entries(parse.input.flags)) {
      if (parse.output.flags[name] !== undefined) {
        validateRelationships(name, flag)
        validateDependsOn(name, flag.dependsOn ?? [])
        validateExclusive(name, flag.exclusive ?? [])
        validateExactlyOne(name, flag.exactlyOne ?? [])
      } else if (flag.required) {
        throw new RequiredFlagError({parse, flag})
      } else if (flag.exactlyOne && flag.exactlyOne.length > 0) {
        validateAcrossFlags(flag)
      }
    }
  }

  function validateExclusive(name: string, exclusive: string[]) {
    for (const also of exclusive) {
      // do not enforce exclusivity for flags that were defaulted
      if (
        parse.output.metadata.flags[also] &&
        parse.output.metadata.flags[also].setFromDefault
      )
        continue
      if (
        parse.output.metadata.flags[name] &&
        parse.output.metadata.flags[name].setFromDefault
      )
        continue
      if (parse.output.flags[also]) {
        throw new CLIError(
          `--${also}= cannot also be provided when using --${name}=`,
        )
      }
    }
  }

  function validateExactlyOne(name: string, exactlyOne: string[]) {
    for (const also of exactlyOne || []) {
      if (also !== name && parse.output.flags[also]) {
        throw new CLIError(
          `--${also}= cannot also be provided when using --${name}=`,
        )
      }
    }
  }

  function validateDependsOn(name: string, dependsOn: string[]) {
    for (const also of dependsOn || []) {
      if (!parse.output.flags[also]) {
        throw new CLIError(
          `--${also}= must also be provided when using --${name}=`,
        )
      }
    }
  }

  function validateSome(flags: string[], errorMessage: string) {
    let foundAtLeastOne = false
    for (const flag of flags) {
      if (parse.output.flags[flag]) {
        foundAtLeastOne = true
        break
      }
    }

    if (!foundAtLeastOne) {
      throw new CLIError(errorMessage)
    }
  }

  function validateRelationships(name: string, flag: CompletableFlag<any>) {
    if (!flag.relationships) return
    for (const relationship of flag.relationships) {
      const flags = relationship.flags ?? []
      const formattedFlags = (flags ?? []).map(f => `--${f}`).join(', ')
      if (relationship.type === 'dependency') {
        if (relationship.method === 'all') {
          validateDependsOn(name, flags)
        }

        if (relationship.method === 'some') {
          validateSome(flags, `One of the following must be provided when using --${name}: ${formattedFlags}`)
        }
      }

      if (relationship.type === 'exclusive') {
        if (relationship.method === 'all') {
          validateExclusive(name, flags)
        }

        if (relationship.method === 'some') {
          validateSome(flags, `The following cannot be provided when using --${name}: ${formattedFlags}`)
        }
      }
    }
  }

  validateArgs()
  validateFlags()
}
