import {CLIError} from '../errors'

import {Arg} from './args'
import {
  InvalidArgsSpecError,
  RequiredArgsError,
  RequiredFlagError,
  UnexpectedArgsError,
} from './errors'
import {ParserInput, ParserOutput} from './parse'
import {IFlag} from './flags'

export function validate(parse: {
  input: ParserInput;
  output: ParserOutput<any, any>;
}) {
  function validateArgs() {
    const maxArgs = parse.input.args.length
    if (parse.input.strict && parse.output.argv.length > maxArgs) {
      const extras = parse.output.argv.slice(maxArgs)
      throw new UnexpectedArgsError({parse, args: extras})
    }

    const missingRequiredArgs: Arg<any>[] = []
    let hasOptional = false

    parse.input.args.forEach((arg, index) => {
      if (!arg.required) {
        hasOptional = true
      } else if (hasOptional) {
        // (required arg) check whether an optional has occurred before
        // optionals should follow required, not before
        throw new InvalidArgsSpecError({parse, args: parse.input.args})
      }

      if (arg.required) {
        if (!parse.output.argv[index]) {
          missingRequiredArgs.push(arg)
        }
      }
    })

    if (missingRequiredArgs.length > 0) {
      throw new RequiredArgsError({parse, args: missingRequiredArgs})
    }
  }

  function validateAcrossFlags(flag: IFlag<any>) {
    const intersection = Object.entries(parse.input.flags)
    .map(entry => entry[0]) // array of flag names
    .filter(flagName => parse.output.flags[flagName] !== undefined) // with values
    .filter(flagName => flag.exactlyOne && flag.exactlyOne.includes(flagName)) // and in the exactlyOne list
    if (intersection.length === 0) {
      // the command's exactlyOne may or may not include itself, so we'll use Set to add + de-dupe
      throw new CLIError(`Exactly one of the following must be provided: ${[
        ...new Set(...flag.exactlyOne || [], flag.name),
      ].join(',')}`)
    }
  }

  function validateFlags() {
    for (const [name, flag] of Object.entries(parse.input.flags)) {
      if (parse.output.flags[name] !== undefined) {
        for (const also of flag.dependsOn || []) {
          if (!parse.output.flags[also]) {
            throw new CLIError(
              `--${also}= must also be provided when using --${name}=`,
            )
          }
        }
        for (const also of flag.exclusive || []) {
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
        for (const also of flag.exactlyOne || []) {
          if (also !== name && parse.output.flags[also]) {
            throw new CLIError(
              `--${also}= cannot also be provided when using --${name}=`,
            )
          }
        }
      } else if (flag.required) {
        throw new RequiredFlagError({parse, flag})
      } else if (flag.exactlyOne && flag.exactlyOne.length > 0) {
        validateAcrossFlags(flag)
      }
    }
  }

  validateArgs()
  validateFlags()
}
