import {
  InvalidArgsSpecError,
  RequiredArgsError,
  Validation,
  UnexpectedArgsError,
  FailedFlagValidationError,
  NonExistentFlagsError,
} from './errors'
import {Arg, CompletableFlag, Flag, FlagRelationship, ParserInput, ParserOutput} from '../interfaces/parser'
import {uniq} from '../config/util'

export async function validate(parse: {
  input: ParserInput;
  output: ParserOutput;
}): Promise<void> {
  function validateArgs() {
    if (parse.input.strict && parse.output.nonExistentFlags?.length > 0) {
      throw new NonExistentFlagsError({parse, flags: parse.output.nonExistentFlags})
    }

    const maxArgs = Object.keys(parse.input.args).length
    if (parse.input.strict && parse.output.argv.length > maxArgs) {
      const extras = parse.output.argv.slice(maxArgs)
      throw new UnexpectedArgsError({parse, args: extras})
    }

    const missingRequiredArgs: Arg<any>[] = []
    let hasOptional = false

    for (const [name, arg] of Object.entries(parse.input.args)) {
      if (!arg.required) {
        hasOptional = true
      } else if (hasOptional) {
        // (required arg) check whether an optional has occurred before
        // optionals should follow required, not before
        throw new InvalidArgsSpecError({parse, args: parse.input.args})
      }

      if (arg.required && !parse.output.args[name] && parse.output.args[name] !== 0) {
        missingRequiredArgs.push(arg)
      }
    }

    if (missingRequiredArgs.length > 0) {
      throw new RequiredArgsError({parse, args: missingRequiredArgs})
    }
  }

  async function validateFlags() {
    const promises = Object.entries(parse.input.flags).map(async ([name, flag]) => {
      const results: Validation[] = []
      if (parse.output.flags[name] !== undefined) {
        results.push(
          ...await validateRelationships(name, flag),
          await validateDependsOn(name, flag.dependsOn ?? []),
          await validateExclusive(name, flag.exclusive ?? []),
          await validateExactlyOne(name, flag.exactlyOne ?? []),
        )
      } else if (flag.required) {
        results.push({status: 'failed', name, validationFn: 'required', reason: `Missing required flag ${name}`})
      } else if (flag.exactlyOne && flag.exactlyOne.length > 0) {
        results.push(validateAcrossFlags(flag))
      }

      return results
    })

    const results = (await Promise.all(promises)).flat()

    const failed = results.filter(r => r.status === 'failed')
    if (failed.length > 0) throw new FailedFlagValidationError({parse, failed})
  }

  async function resolveFlags(flags: FlagRelationship[]): Promise<Record<string, unknown>> {
    const promises = flags.map(async flag => {
      if (typeof flag === 'string') {
        return [flag, parse.output.flags[flag]]
      }

      const result = await flag.when(parse.output.flags)
      return result ? [flag.name, parse.output.flags[flag.name]] : null
    })
    const resolved = await Promise.all(promises)
    return Object.fromEntries(resolved.filter(r => r !== null) as [string, unknown][])
  }

  function getPresentFlags(flags: Record<string, unknown>): string[] {
    return Object.keys(flags).reduce((acc, key) => {
      if (flags[key] !== undefined) acc.push(key)
      return acc
    }, [] as string[])
  }

  function validateAcrossFlags(flag: Flag<any>): Validation {
    const base = {name: flag.name, validationFn: 'validateAcrossFlags'}
    const intersection = Object.entries(parse.input.flags)
    .map(entry => entry[0]) // array of flag names
    .filter(flagName => parse.output.flags[flagName] !== undefined) // with values
    .filter(flagName => flag.exactlyOne && flag.exactlyOne.includes(flagName)) // and in the exactlyOne list
    if (intersection.length === 0) {
      // the command's exactlyOne may or may not include itself, so we'll use Set to add + de-dupe
      const deduped = uniq(flag.exactlyOne?.map(flag => `--${flag}`) ?? []).join(', ')
      const reason = `Exactly one of the following must be provided: ${deduped}`
      return {...base, status: 'failed', reason}
    }

    return {...base, status: 'success'}
  }

  async function validateExclusive(name: string, flags: FlagRelationship[]): Promise<Validation> {
    const base = {name, validationFn: 'validateExclusive'}
    const resolved = await resolveFlags(flags)
    const keys = getPresentFlags(resolved)
    for (const flag of keys) {
      // do not enforce exclusivity for flags that were defaulted
      if (parse.output.metadata.flags && parse.output.metadata.flags[flag]?.setFromDefault)
        continue
      if (parse.output.metadata.flags && parse.output.metadata.flags[name]?.setFromDefault)
        continue
      if (parse.output.flags[flag] !== undefined) {
        return {...base, status: 'failed', reason: `--${flag}=${parse.output.flags[flag]} cannot also be provided when using --${name}`}
      }
    }

    return {...base, status: 'success'}
  }

  async function validateExactlyOne(name: string, flags: FlagRelationship[]): Promise<Validation> {
    const base = {name, validationFn: 'validateExactlyOne'}
    const resolved = await resolveFlags(flags)
    const keys = getPresentFlags(resolved)
    for (const flag of keys) {
      if (flag !== name && parse.output.flags[flag] !== undefined) {
        return {...base, status: 'failed', reason: `--${flag} cannot also be provided when using --${name}`}
      }
    }

    return {...base, status: 'success'}
  }

  async function validateDependsOn(name: string, flags: FlagRelationship[]): Promise<Validation> {
    const base = {name, validationFn: 'validateDependsOn'}
    const resolved = await resolveFlags(flags)
    const foundAll = Object.values(resolved).every(val => val !== undefined)
    if (!foundAll) {
      const formattedFlags = Object.keys(resolved).map(f => `--${f}`).join(', ')
      return {...base, status: 'failed', reason: `All of the following must be provided when using --${name}: ${formattedFlags}`}
    }

    return {...base, status: 'success'}
  }

  async function validateSome(name: string, flags: FlagRelationship[]): Promise<Validation> {
    const base = {name, validationFn: 'validateSome'}
    const resolved = await resolveFlags(flags)
    const foundAtLeastOne = Object.values(resolved).some(Boolean)
    if (!foundAtLeastOne) {
      const formattedFlags = Object.keys(resolved).map(f => `--${f}`).join(', ')
      return {...base, status: 'failed', reason: `One of the following must be provided when using --${name}: ${formattedFlags}`}
    }

    return {...base, status: 'success'}
  }

  async function validateRelationships(name: string, flag: CompletableFlag<any>): Promise<Validation[]> {
    if (!flag.relationships) return []
    const results = await Promise.all(flag.relationships.map(async relationship => {
      const flags = relationship.flags ?? []
      const results = []
      switch (relationship.type) {
      case 'all':
        results.push(await validateDependsOn(name, flags))
        break
      case 'some':
        results.push(await validateSome(name, flags))
        break
      case 'none':
        results.push(await validateExclusive(name, flags))
        break
      default:
        break
      }

      return results
    }))

    return results.flat()
  }

  validateArgs()
  await validateFlags()
}
