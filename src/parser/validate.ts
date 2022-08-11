/* eslint-disable no-await-in-loop */
import {CLIError} from '../errors'

import {
  InvalidArgsSpecError,
  RequiredArgsError,
  RequiredFlagError,
  UnexpectedArgsError,
} from './errors'
import {ParserArg, ParserInput, ParserOutput, Flag, CompletableFlag} from '../interfaces'
import {FlagRelationship} from '../interfaces/parser'

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

  async function validateFlags() {
    for (const [name, flag] of Object.entries(parse.input.flags)) {
      if (parse.output.flags[name] !== undefined) {
        await validateRelationships(name, flag)
        await validateDependsOn(name, flag.dependsOn ?? [])
        await validateExclusive(name, flag.exclusive ?? [])
        validateExactlyOne(name, flag.exactlyOne ?? [])
      } else if (flag.required) {
        throw new RequiredFlagError({parse, flag})
      } else if (flag.exactlyOne && flag.exactlyOne.length > 0) {
        validateAcrossFlags(flag)
      }
    }
  }

  async function resolveFlags(flags: FlagRelationship[], defaultValue = true): Promise<Record<string, boolean | string>> {
    const promises = flags.map(async flag => {
      if (typeof flag === 'string') {
        return [flag, parse.output.flags[flag]]
      }

      if (await flag.when(parse.output.flags[flag.name])) {
        return [flag.name, parse.output.flags[flag.name]]
      }

      return [flag.name, defaultValue]
    })
    return Object.fromEntries(await Promise.all(promises))
  }

  async function validateExclusive(name: string, flags: FlagRelationship[]) {
    const resolved = await resolveFlags(flags, false)
    const keys = Object.keys(resolved).reduce((acc, key) => {
      if (resolved[key]) acc.push(key)
      return acc
    }, [] as string[])

    for (const flag of keys) {
      // do not enforce exclusivity for flags that were defaulted
      if (
        parse.output.metadata.flags[flag] &&
        parse.output.metadata.flags[flag].setFromDefault
      )
        continue
      if (
        parse.output.metadata.flags[name] &&
        parse.output.metadata.flags[name].setFromDefault
      )
        continue
      if (parse.output.flags[flag]) {
        throw new CLIError(
          `--${flag}=${parse.output.flags[flag]} cannot also be provided when using --${name}`,
        )
      }
    }
  }

  function validateExactlyOne(name: string, exactlyOne: FlagRelationship[]) {
    for (const flag of exactlyOne || []) {
      const flagName = typeof flag === 'string' ? flag : flag.name
      if (flagName !== name && parse.output.flags[flagName]) {
        throw new CLIError(
          `--${flagName} cannot also be provided when using --${name}`,
        )
      }
    }
  }

  async function validateDependsOn(name: string, flags: FlagRelationship[]) {
    const resolved = await resolveFlags(flags)
    const foundAll = Object.values(resolved).every(Boolean)
    if (!foundAll) {
      const required = Object.keys(resolved).reduce((acc, key) => {
        if (!resolved[key]) acc.push(key)
        return acc
      }, [] as string[])
      const formattedFlags = required.map(f => `--${f}`).join(', ')
      throw new CLIError(
        `All of the following must be provided when using --${name}: ${formattedFlags}`,
      )
    }
  }

  async function validateSome(flags: FlagRelationship[], errorMessage: string) {
    const resolved = await resolveFlags(flags)
    const foundAtLeastOne = Object.values(resolved).some(Boolean)
    if (!foundAtLeastOne) {
      throw new CLIError(errorMessage)
    }
  }

  async function validateRelationships(name: string, flag: CompletableFlag<any>) {
    if (!flag.relationships) return
    for (const relationship of flag.relationships) {
      const flags = relationship.flags ?? []
      const formattedFlags = (flags ?? []).map(f => typeof f === 'string' ? `--${f}` : `--${f.name}`).join(', ')
      if (relationship.type === 'all') {
        await validateDependsOn(name, flags)
      }

      if (relationship.type === 'some') {
        await validateSome(flags, `One of the following must be provided when using --${name}: ${formattedFlags}`)
      }

      if (relationship.type === 'never') {
        await validateExclusive(name, flags)
      }
    }
  }

  validateArgs()
  await validateFlags()
}
