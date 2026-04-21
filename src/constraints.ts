import {
  ComplexFlagCriterionTester,
  FlagGroup,
  FlagOutput,
  Constraint as IConstraint,
  SimpleFlagCriterionTester,
} from './interfaces/parser'
import {Validation} from './parser/errors'

export function flag(flagName: string): Constraint {
  return new Constraint([flagName])
}

export function flags(...flagNames: string[]): Constraint {
  return new Constraint(flagNames)
}

export function combinationOf(...flagNames: string[]): FlagGroup {
  return {
    flags: flagNames,
    type: 'all',
  }
}

class Constraint implements IConstraint {
  public readonly are: Constraint = this
  public readonly is: Constraint = this
  private readonly constrainedFlags: string[]
  private constraintApplicatorFunction: (flags: FlagOutput) => string | null
  private constraintType: string

  public constructor(constrainedFlags: string[]) {
    this.constrainedFlags = constrainedFlags
    this.constraintType = 'default'
    this.constraintApplicatorFunction = () => null
  }

  public get and(): Constraint {
    return this
  }

  public get or(): Constraint {
    return this
  }

  public get unless(): Constraint {
    return this
  }

  public get when(): Constraint {
    return this
  }

  public _evaluateAgainstFlags(flags: FlagOutput): Validation {
    const constraintResult = this.constraintApplicatorFunction(flags)
    return {
      name: this.constrainedFlags.join(','),
      reason: constraintResult ?? '',
      status: this.constraintApplicatorFunction(flags) ? 'failed' : 'success',
      validationFn: this.constraintType,
    }
  }

  public allFlagCriteriaSatisfied(_criterionTester: SimpleFlagCriterionTester): Constraint {
    this.constraintType = 'allFlagCriteriaSatisfied'
    return this
  }

  public anyFlagCriterionSatisfied(_criterionTester: SimpleFlagCriterionTester): Constraint {
    this.constraintType = 'anyFlagCriterionSatisfied'
    return this
  }

  public dependentOn(...dependencyFlagGroups: FlagGroup[]): Constraint {
    this.constraintType = 'oneWayDependency'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundConstraintFlags = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundConstraintFlags.length === 0) {
        return null
      }

      for (const dependencyFlagGroup of dependencyFlagGroups) {
        if (typeof dependencyFlagGroup === 'string') {
          if (dependencyFlagGroup in flags && flags[dependencyFlagGroup] !== undefined) {
            return null
          }
        } else {
          const foundFlagsInDependencyGroup = filterFlagsPresentInInput(dependencyFlagGroup.flags, flags)
          if (foundFlagsInDependencyGroup.length === dependencyFlagGroup.flags.length) {
            return null
          }
        }
      }

      const multipleConstrainedFlags = this.constrainedFlags.length > 1
      const header: string = multipleConstrainedFlags
        ? `Flags ${createFlagString(this.constrainedFlags)} require`
        : `Flag ${createFlagString(this.constrainedFlags)} requires`
      return `${header} at least one of the following: ${createFlagString(dependencyFlagGroups)}.`
    }

    return this
  }

  public exclusiveWith(...exclusionFlagGroups: FlagGroup[]): Constraint {
    this.constraintType = 'oneWayExclusivity'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundConstraintFlags = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundConstraintFlags.length === 0) {
        return null
      }

      let exclusionGroupFound = false
      for (const exclusionFlagGroup of exclusionFlagGroups) {
        if (typeof exclusionFlagGroup === 'string') {
          if (exclusionFlagGroup in flags && flags[exclusionFlagGroup] !== undefined) {
            exclusionGroupFound = true
            break
          }
        } else {
          const foundFlagsInExclusionGroup = filterFlagsPresentInInput(exclusionFlagGroup.flags, flags)
          if (foundFlagsInExclusionGroup.length === exclusionFlagGroup.flags.length) {
            exclusionGroupFound = true
            break
          }
        }
      }

      if (!exclusionGroupFound) {
        return null
      }

      const multipleConstrainedFlags = this.constrainedFlags.length > 1
      const header: string = multipleConstrainedFlags ? 'Flags' : 'Flag'
      return `${header} ${createFlagString(this.constrainedFlags)} cannot be used with any of the following: ${createFlagString(exclusionFlagGroups)}.`
    }

    return this
  }

  public mutuallyDependent(): Constraint {
    this.constraintType = 'mutualDependency'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length === 0 || foundFlags.length === this.constrainedFlags.length) {
        return null
      }

      return `The following flags are mutually dependent: ${createFlagString(this.constrainedFlags)}. Found only ${createFlagString(foundFlags)}.`
    }

    return this
  }

  public mutuallyExclusive(): Constraint {
    this.constraintType = 'mutualExclusivity'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length <= 1) {
        return null
      }

      return `The following flags are mutually exclusive: ${createFlagString(this.constrainedFlags)}. Found: ${createFlagString(foundFlags)}.`
    }

    return this
  }

  public requiredAll(): Constraint {
    this.constraintType = 'requiredAll'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length === this.constrainedFlags.length) {
        return null
      }

      const requirement = this.constrainedFlags.length > 1 ? 'These flags are required' : 'This flag is required'
      const findings = foundFlags.length > 0 ? `Found only: ${createFlagString(foundFlags)}.` : 'Found none.'
      return `${requirement}: ${createFlagString(this.constrainedFlags)}. ${findings}`
    }

    return this
  }

  public requiredAny(): Constraint {
    this.constraintType = 'requiredAny'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length > 0) {
        return null
      }

      return `Must provide at least one of these flags: ${createFlagString(this.constrainedFlags)}.`
    }

    return this
  }

  public requiredAtLeastN(n: number): Constraint {
    this.constraintType = `requiredAtLeast${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) => required(n, 'AT_LEAST_N', this.constrainedFlags, flags)
    return this
  }

  public requiredAtMostN(n: number): Constraint {
    this.constraintType = `requiredAtMost${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) => required(n, 'AT_MOST_N', this.constrainedFlags, flags)
    return this
  }

  public requiredExactlyN(n: number): Constraint {
    this.constraintType = `requiredExactly${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) => required(n, 'EXACTLY_N', this.constrainedFlags, flags)
    return this
  }

  public thisIsTrue(_flagTester: ComplexFlagCriterionTester): Constraint {
    this.constraintType = 'complexCustomConstraint'
    return this
  }
}

const Requirement = {
  AT_LEAST_N: {
    fn: (n: number, other: number) => other >= n,
    label: 'at least',
  },
  AT_MOST_N: {
    fn: (n: number, other: number) => other <= n,
    label: 'at most',
  },
  EXACTLY_N: {
    fn: (n: number, other: number) => other === n,
    label: 'exactly',
  },
}

type RequirementType = keyof typeof Requirement

function required(
  n: number,
  requirementType: RequirementType,
  soughtFlags: string[],
  providedFlags: FlagOutput,
): string | null {
  const foundFlags: string[] = filterFlagsPresentInInput(soughtFlags, providedFlags)
  if (Requirement[requirementType].fn(n, foundFlags.length)) {
    return null
  }

  return `Must provide ${Requirement[requirementType].label} ${n} of the following: ${createFlagString(soughtFlags)}. Found ${foundFlags.length}.`
}

function filterFlagsPresentInInput(flagsToSeek: string[], flags: FlagOutput): string[] {
  return flagsToSeek.filter((f) => f in flags && flags[f] !== undefined)
}

function createFlagString(flags: FlagGroup[]): string {
  const processedGroups: string[] = flags.map((f) => {
    if (typeof f === 'string') {
      return `--${f}`
    }

    return `combination of ${f.flags.map((f) => `--${f}`).join(' and ')}`
  })
  return processedGroups.join(', ')
}
