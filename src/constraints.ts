import {FlagOutput} from './interfaces/parser'

type SimpleFlagGroup = string

type ComplexFlagGroup = {
  type: 'all'
  flags: string[]
}

type FlagGroup = SimpleFlagGroup | ComplexFlagGroup

type SimpleFlagCriterionTester = {
  [key: string]: (val: any) => boolean
}

type ComplexFlagCriterionTester = (flags: FlagOutput) => boolean

export function flag(flagName: string): Constraint {
  return new Constraint([flagName])
}

export function flags(...flagNames: string[]): Constraint {
  return new Constraint(flagNames)
}

export function combinationOf(...flagNames: string[]): ComplexFlagGroup {
  return {
    flags: flagNames,
    type: 'all',
  }
}

class Constraint {
  public readonly are: Constraint = this
  public readonly is: Constraint = this

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  public constructor(_constrainedFlags: string[]) {}

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

  public allFlagCriteriaSatisfied(_criterionTester: SimpleFlagCriterionTester): Constraint {
    return this
  }

  public anyFlagCriterionSatisfied(_criterionTester: SimpleFlagCriterionTester): Constraint {
    return this
  }

  public dependentOn(..._dependencyFlagGroups: FlagGroup[]): Constraint {
    return this
  }

  public exclusiveWith(..._exclusionFlagGroups: FlagGroup[]): Constraint {
    return this
  }

  public mutuallyDependent(): Constraint {
    return this
  }

  public mutuallyExclusive(): Constraint {
    return this
  }

  public requiredAll(): Constraint {
    return this
  }

  public requiredAny(): Constraint {
    return this
  }

  public requiredAtLeastN(_n: number): Constraint {
    return this
  }

  public requiredAtMostN(_n: number): Constraint {
    return this
  }

  public requiredExactlyN(_n: number): Constraint {
    return this
  }

  public thisIsTrue(_flagTester: ComplexFlagCriterionTester): Constraint {
    return this
  }
}
