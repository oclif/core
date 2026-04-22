import {Constraint, FlagGroup, FlagOutput, MultiFlagTester, SingleFlagTester} from './interfaces/parser'
import {Validation} from './parser/errors'

export function flag(flagName: string): ConstraintImpl {
  return new ConstraintImpl([flagName])
}

export function flags(...flagNames: string[]): ConstraintImpl {
  return new ConstraintImpl(flagNames)
}

export function combinationOf(...flagNames: string[]): FlagGroup {
  return {
    flags: flagNames,
    type: 'all',
  }
}

class ConstraintImpl implements Constraint {
  public readonly are: ConstraintImpl = this
  public readonly is: ConstraintImpl = this
  private readonly constrainedFlags: string[]
  private constraintApplicatorFunction: (flags: FlagOutput) => string | null
  private constraintType: string
  private topLevelCondition: Condition | undefined
  private underConstructionCondition: Condition | undefined

  public constructor(constrainedFlags: string[]) {
    this.constrainedFlags = constrainedFlags
    this.constraintType = 'default'
    this.constraintApplicatorFunction = () => null
  }

  public get and(): ConstraintImpl {
    if (this.topLevelCondition === undefined) {
      throw new Error('FILLER: NO CONDITION')
    }

    if (this.underConstructionCondition) {
      throw new Error('FILLER: CONDITION ALREADY BEING CONSTRUCTED')
    }

    this.topLevelCondition = new AndCondition(this.topLevelCondition)
    this.underConstructionCondition = this.topLevelCondition
    return this
  }

  public get or(): ConstraintImpl {
    if (this.topLevelCondition === undefined) {
      throw new Error('FILLER: NO CONDITION')
    }

    if (this.underConstructionCondition) {
      throw new Error('FILLER: CONDITION ALREADY BEING CONSTRUCTED')
    }

    this.topLevelCondition = new OrCondition(this.topLevelCondition)
    this.underConstructionCondition = this.topLevelCondition
    return this
  }

  public get unless(): ConstraintImpl {
    const newUnless: Condition = new UnlessCondition()
    if (this.topLevelCondition === undefined) {
      this.topLevelCondition = newUnless
    }

    if (this.underConstructionCondition === undefined) {
      this.underConstructionCondition = newUnless
    } else if (this.underConstructionCondition instanceof UnaryOpCondition) {
      this.underConstructionCondition.setCondition(newUnless)
      this.underConstructionCondition = newUnless
    } else if (this.underConstructionCondition instanceof BinaryCondition) {
      this.underConstructionCondition.setRight(newUnless)
      this.underConstructionCondition = newUnless
    } else {
      throw new TypeError('FILLER: UNKNOWN SCENARIO')
    }

    return this
  }

  public get when(): ConstraintImpl {
    const newWhen: Condition = new WhenCondition()
    if (this.topLevelCondition === undefined) {
      this.topLevelCondition = newWhen
    }

    if (this.underConstructionCondition === undefined) {
      this.underConstructionCondition = newWhen
    } else if (this.underConstructionCondition instanceof UnaryOpCondition) {
      this.underConstructionCondition.setCondition(newWhen)
      this.underConstructionCondition = newWhen
    } else if (this.underConstructionCondition instanceof BinaryCondition) {
      this.underConstructionCondition.setRight(newWhen)
      this.underConstructionCondition = newWhen
    } else {
      throw new TypeError('FILLER: Unsupported scenario')
    }

    return this
  }

  public _evaluateAgainstFlags(flags: FlagOutput): Validation {
    const conditionSatisfied = this.topLevelCondition ? this.topLevelCondition.isSatisfied(flags) : true
    const constraintResult = this.constraintApplicatorFunction(flags)
    return {
      name: this.constrainedFlags.join(','),
      reason: constraintResult ?? '',
      status: conditionSatisfied && constraintResult !== null ? 'failed' : 'success',
      validationFn: this.constraintType,
    }
  }

  public allFlagCriteriaSatisfied(criterionTester: SingleFlagTester): ConstraintImpl {
    this.constraintType = 'allFlagCriteriaSatisfied'
    if (this.underConstructionCondition === undefined) {
      throw new Error('Filler: INVALID CONDITION')
    } else if (this.underConstructionCondition instanceof UnaryOpCondition) {
      this.underConstructionCondition.setCondition(new AllFlagCriteriaSatisfiedCondition(criterionTester))
      this.underConstructionCondition = undefined
    } else if (this.underConstructionCondition instanceof BinaryCondition) {
      this.underConstructionCondition.setRight(new AllFlagCriteriaSatisfiedCondition(criterionTester))
      this.underConstructionCondition = undefined
    } else {
      throw new TypeError('Unsupported scenario')
    }

    return this
  }

  public anyFlagCriterionSatisfied(criterionTester: SingleFlagTester): ConstraintImpl {
    this.constraintType = 'anyFlagCriterionSatisfied'
    if (this.underConstructionCondition === undefined) {
      throw new Error('Filler: INVALID CONDITION')
    } else if (this.underConstructionCondition instanceof UnaryOpCondition) {
      this.underConstructionCondition.setCondition(new AnyFlagCriterionSatisfiedCondition(criterionTester))
      this.underConstructionCondition = undefined
    } else if (this.underConstructionCondition instanceof BinaryCondition) {
      this.underConstructionCondition.setRight(new AnyFlagCriterionSatisfiedCondition(criterionTester))
      this.underConstructionCondition = undefined
    } else {
      throw new TypeError('Filler: Unsupported scenario')
    }

    return this
  }

  public dependentOn(...dependencyFlagGroups: FlagGroup[]): ConstraintImpl {
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
      return `${header} at least one of the following${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(dependencyFlagGroups)}.`
    }

    return this
  }

  public exclusiveWith(...exclusionFlagGroups: FlagGroup[]): ConstraintImpl {
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
      return `${header} ${createFlagString(this.constrainedFlags)} cannot be used with any of the following${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(exclusionFlagGroups)}.`
    }

    return this
  }

  public mutuallyDependent(): ConstraintImpl {
    this.constraintType = 'mutualDependency'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length === 0 || foundFlags.length === this.constrainedFlags.length) {
        return null
      }

      return `The following flags are mutually dependent${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(this.constrainedFlags)}. Found only ${createFlagString(foundFlags)}.`
    }

    return this
  }

  public mutuallyExclusive(): ConstraintImpl {
    this.constraintType = 'mutualExclusivity'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length <= 1) {
        return null
      }

      return `The following flags are mutually exclusive${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(this.constrainedFlags)}. Found: ${createFlagString(foundFlags)}.`
    }

    return this
  }

  public requiredAll(): ConstraintImpl {
    this.constraintType = 'requiredAll'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags: string[] = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length === this.constrainedFlags.length) {
        return null
      }

      const requirement = this.constrainedFlags.length > 1 ? 'These flags are required' : 'This flag is required'
      const findings = foundFlags.length > 0 ? `Found only: ${createFlagString(foundFlags)}.` : 'Found none.'
      return `${requirement}${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(this.constrainedFlags)}. ${findings}`
    }

    return this
  }

  public requiredAny(): ConstraintImpl {
    this.constraintType = 'requiredAny'
    this.constraintApplicatorFunction = (flags: FlagOutput) => {
      const foundFlags = filterFlagsPresentInInput(this.constrainedFlags, flags)
      if (foundFlags.length > 0) {
        return null
      }

      return `Must provide at least one of these flags${this.topLevelCondition ? ' under current circumstances:' : ':'} ${createFlagString(this.constrainedFlags)}.`
    }

    return this
  }

  public requiredAtLeastN(n: number): ConstraintImpl {
    this.constraintType = `requiredAtLeast${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) =>
      required(n, 'AT_LEAST_N', this.constrainedFlags, flags, this.topLevelCondition !== undefined)
    return this
  }

  public requiredAtMostN(n: number): ConstraintImpl {
    this.constraintType = `requiredAtMost${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) =>
      required(n, 'AT_MOST_N', this.constrainedFlags, flags, this.topLevelCondition !== undefined)
    return this
  }

  public requiredExactlyN(n: number): ConstraintImpl {
    this.constraintType = `requiredExactly${n}`
    this.constraintApplicatorFunction = (flags: FlagOutput) =>
      required(n, 'EXACTLY_N', this.constrainedFlags, flags, this.topLevelCondition !== undefined)
    return this
  }

  public thisIsTrue(flagTester: MultiFlagTester): ConstraintImpl {
    this.constraintType = 'complexCustomConstraint'
    if (this.underConstructionCondition === undefined) {
      throw new Error('Filler: INVALID CONDITION')
    } else if (this.underConstructionCondition instanceof UnaryOpCondition) {
      this.underConstructionCondition.setCondition(new ThisIsTrueCondition(flagTester))
      this.underConstructionCondition = undefined
    } else if (this.underConstructionCondition instanceof BinaryCondition) {
      this.underConstructionCondition.setRight(new ThisIsTrueCondition(flagTester))
      this.underConstructionCondition = undefined
    } else {
      throw new TypeError('FILLER: Unsupported scenario')
    }

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
  hasConditions: boolean,
): string | null {
  const foundFlags: string[] = filterFlagsPresentInInput(soughtFlags, providedFlags)
  if (Requirement[requirementType].fn(n, foundFlags.length)) {
    return null
  }

  return `Must provide ${Requirement[requirementType].label} ${n} of the following${hasConditions ? ' under current circumstances:' : ':'} ${createFlagString(soughtFlags)}. Found ${foundFlags.length}.`
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

abstract class Condition {
  abstract isSatisfied(flags: FlagOutput): boolean
}

abstract class UnaryOpCondition extends Condition {
  protected condition: Condition | undefined

  public setCondition(condition: Condition): void {
    if (this.condition) {
      throw new Error('FILLER: DUPLICATE CONDITION')
    }

    this.condition = condition
  }
}

class WhenCondition extends UnaryOpCondition {
  public isSatisfied(flags: FlagOutput): boolean {
    if (this.condition) {
      return this.condition.isSatisfied(flags)
    }

    throw new Error('FILLER: INVALID WHERE')
  }
}

class UnlessCondition extends UnaryOpCondition {
  public isSatisfied(flags: FlagOutput): boolean {
    if (this.condition) {
      return !this.condition.isSatisfied(flags)
    }

    throw new Error('FILLER: INVALID UNLESS')
  }
}

class AllFlagCriteriaSatisfiedCondition extends Condition {
  private readonly tester: SingleFlagTester

  public constructor(tester: SingleFlagTester) {
    super()
    this.tester = tester
  }

  public isSatisfied(flags: FlagOutput): boolean {
    for (const testedFlag of Object.keys(this.tester)) {
      if (!this.tester[testedFlag](flags[testedFlag])) {
        return false
      }
    }

    return true
  }
}

class AnyFlagCriterionSatisfiedCondition extends Condition {
  private readonly tester: SingleFlagTester

  public constructor(tester: SingleFlagTester) {
    super()
    this.tester = tester
  }

  public isSatisfied(flags: FlagOutput): boolean {
    for (const testedFlag of Object.keys(this.tester)) {
      if (this.tester[testedFlag](flags[testedFlag])) {
        return true
      }
    }

    return false
  }
}

class ThisIsTrueCondition extends Condition {
  private readonly tester: MultiFlagTester

  public constructor(tester: MultiFlagTester) {
    super()
    this.tester = tester
  }

  public isSatisfied(flags: FlagOutput): boolean {
    return this.tester(flags)
  }
}

abstract class BinaryCondition extends Condition {
  protected readonly left: Condition
  protected right?: Condition

  public constructor(left: Condition) {
    super()
    this.left = left
  }

  public setRight(right: Condition): void {
    this.right = right
  }
}

class AndCondition extends BinaryCondition {
  public isSatisfied(flags: FlagOutput): boolean {
    return this.left.isSatisfied(flags) && (this.right ? this.right.isSatisfied(flags) : true)
  }
}

class OrCondition extends BinaryCondition {
  public isSatisfied(flags: FlagOutput): boolean {
    return this.left.isSatisfied(flags) || (this.right ? this.right.isSatisfied(flags) : false)
  }
}
