/* eslint-disable max-nested-callbacks */

import {expect} from 'chai'

import * as Constraints from '../../src/constraints'
import * as Flags from '../../src/flags'
import {parse} from '../../src/parser'

describe('flag constraints tests', () => {
  it('properly handles error thrown within constraint condition evaluation', async () => {
    let message = ''
    const tester = {
      foo(_v: any) {
        throw new Error('test-only-error!')
      },
    }
    try {
      await parse(['--foo', 'a'], {
        flags: {
          foo: Flags.string(),
        },
        constraints: [Constraints.flag('foo').is.requiredAll().when.anyFlagCriterionSatisfied(tester)],
      })
    } catch (error: any) {
      message = error.message
    }

    expect(message).to.include('Error evaluating constraint conditions on --foo: test-only-error')
  })

  describe('validations', () => {
    const flags = {
      foo: Flags.string(),
      bar: Flags.string(),
      baz: Flags.string(),
    }

    it('constraint expression that applies multiple constraints is forbidden', async () => {
      let message = ''
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const command = {
          flags,
          constraints: [Constraints.flag('foo').is.requiredAll().requiredAny()],
        }
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include(
        'Misconfigured Constraint: Cannot apply multiple kinds of constraint within one statement: requiredAll, requiredAny. Use multiple constraint expressions instead.',
      )
    })

    for (const op of ['and', 'or']) {
      describe(`binary operator .${op}`, () => {
        const typedOp: 'and' | 'or' = op as 'and' | 'or'

        it(`cannot use .${typedOp} without at least one preceding .when/.unless`, async () => {
          let message = ''
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const command = {
              flags,
              constraints: [
                Constraints.flag('foo')
                  .is.requiredAny()
                  [typedOp].thisIsTrue(() => true),
              ],
            }
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include(`Misconfigured constraint on --foo: '${op}' requires a 'when' or 'unless'.`)
        })

        it(`cannot use .${typedOp} immediately after a .when/.unless`, async () => {
          let message = ''
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const command = {
              flags,
              constraints: [
                Constraints.flag('foo')
                  .is.requiredAny()
                  .when[typedOp].thisIsTrue(() => true),
              ],
            }
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include(`Misconfigured constraint on --foo: '${op}' cannot directly follow 'when'`)
        })
      })
    }

    for (const logicalOp of ['allFlagCriteriaSatisfied', 'anyFlagCriterionSatisfied']) {
      const typedOp: 'allFlagCriteriaSatisfied' | 'anyFlagCriterionSatisfied' = logicalOp as
        | 'allFlagCriteriaSatisfied'
        | 'anyFlagCriterionSatisfied'

      it(`cannot use .${typedOp} without an immediately preceding .when/.unless/.and/.or`, async () => {
        let message = ''
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const command = {
            flags,
            constraints: [Constraints.flag('foo').is.requiredAny()[typedOp]({})],
          }
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          `Misconfigured constraint condition on --foo: ${typedOp} must immediately follow a when/unless/and/or`,
        )
      })
    }

    it('cannot use .thisIsTrue without an immediately preceding .when/.unless/.and/.or', async () => {
      let message = ''
      try {
        const command = {
          flags,
          constraints: [
            Constraints.flag('foo')
              .is.requiredAny()
              .thisIsTrue((_flags) => true),
          ],
        }
        await parse(['--foo', 'a'], command)
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include(
        `Misconfigured constraint condition on --foo: thisIsTrue must immediately follow a when/unless/and/or`,
      )
    })

    for (const conditionOp of ['when', 'unless']) {
      describe(`conditional operator .${conditionOp}`, () => {
        const typedOp: 'when' | 'unless' = conditionOp as 'when' | 'unless'

        it(`.${conditionOp} is invalid without any logical operators`, async () => {
          let message = ''
          try {
            const command = {
              flags,
              constraints: [Constraints.flag('foo').is.requiredAny()[typedOp]],
            }
            await parse(['--foo', 'a'], command)
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include(
            `Error evaluating constraint conditions on --foo: '${conditionOp}' expression without any conditions`,
          )
        })

        it(`.${conditionOp} can only hold one operator`, async () => {
          let message = ''
          try {
            const command = {
              flags,
              constraints: [
                Constraints.flag('foo')
                  .is.requiredAny()
                  [typedOp].allFlagCriteriaSatisfied({})
                  .anyFlagCriterionSatisfied({}),
              ],
            }
            await parse(['--foo', 'a'], command)
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include(
            `Misconfigured constraint condition on --foo: anyFlagCriterionSatisfied must immediately follow a when/unless/and/or`,
          )
        })
      })
    }
  })

  describe('requirement constraints', () => {
    describe('.requiredAll()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.requiredAll()],
      }

      it('is satisfied when all flags are included', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('is violated when any flag is absent', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('These flags are required: --foo, --bar, --baz. Found only: --foo.')
      })
    })

    describe('.requiredAny()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.requiredAny()],
      }

      it('is satisfied when any required flag is included', async () => {
        const out = await parse(['--bar', 'b'], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when no required flags are included', async () => {
        let message = ''
        try {
          await parse([], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Must provide at least one of these flags: --foo, --bar, --baz.')
      })
    })

    describe('.requiredExactlyN()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.requiredExactlyN(2)],
      }

      it('is satisfied when exactly N flags are present', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when fewer than N flags are present', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Must provide exactly 2 of the following: --foo, --bar, --baz. Found 1.')
      })

      it('is violated when more than N flags are present', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Must provide exactly 2 of the following: --foo, --bar, --baz. Found 3.')
      })
    })

    describe('.requiredAtLeastN()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.requiredAtLeastN(2)],
      }

      it('is satisfied when exactly N flags are present', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when fewer than N flags are present', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Must provide at least 2 of the following: --foo, --bar, --baz. Found 1.')
      })

      it('is satisfied when more than N flags are present', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })
    })

    describe('.requiredAtMostN()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.requiredAtMostN(2)],
      }

      it('is satisfied when exactly N flags are present', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      it('is satisfied when fewer than N flags are present', async () => {
        const out = await parse(['--foo', 'a'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when more than N flags are present', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Must provide at most 2 of the following: --foo, --bar, --baz. Found 3.')
      })
    })
  })

  describe('dependency', () => {
    describe('.mutuallyDependent', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.mutuallyDependent()],
      }

      it('is satisfied when no mutually dependent flags are included', async () => {
        const out = await parse([], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('is satisfied when all mutually dependent flags are included', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('is violated when only some mutually dependent flags are included', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a', '--bar', 'b'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually dependent: --foo, --bar, --baz. Found only --foo, --bar.',
        )
      })
    })

    describe('.dependentOn()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flag('foo').is.dependentOn('bar', 'baz')],
      }

      it('is satisfied when neither dependant flag nor any dependency flags are included', async () => {
        const out = await parse([], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('is satisfied when only dependency flags are included', async () => {
        const out = await parse(['--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('is satisfied when dependant flag and at least one dependency flag are included', async () => {
        const out = await parse(['--foo', 'a', '--bar', 'b'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when dependant flag is included with no dependency flags', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Flag --foo requires at least one of the following: --bar, --baz.')
      })

      it('implies no dependency between dependency flags themselves', async () => {
        const out = await parse(['--bar', 'b'], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.be.undefined
      })

      describe('using .combinationOf()', () => {
        describe('one .combinationOf instance', () => {
          const command = {
            flags: {
              foo: Flags.string(),
              bar: Flags.string(),
              baz: Flags.string(),
            },
            constraints: [Constraints.flag('foo').is.dependentOn(Constraints.combinationOf('bar', 'baz'))],
          }

          it('is satisfied when neither dependant flag nor dependency flags are included', async () => {
            const out = await parse([], command)
            expect(out.flags.foo).to.be.undefined
            expect(out.flags.bar).to.be.undefined
            expect(out.flags.baz).to.be.undefined
          })

          it('is satisfied when dependant flag is present and all dependency flags are included', async () => {
            const out = await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
            expect(out.flags.foo).to.equal('a')
            expect(out.flags.bar).to.equal('b')
            expect(out.flags.baz).to.equal('c')
          })

          it('is violated when dependant flag is present and any dependency flag is absent', async () => {
            let message = ''
            try {
              await parse(['--foo', 'a', '--bar', 'b'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'Flag --foo requires at least one of the following: combination of --bar and --baz.',
            )
          })
        })

        describe('multiple .combinationOf() instances', () => {
          const command = {
            flags: {
              foo: Flags.string(),
              bar1: Flags.string(),
              bar2: Flags.string(),
              baz1: Flags.string(),
              baz2: Flags.string(),
            },
            constraints: [
              Constraints.flag('foo').is.dependentOn(
                Constraints.combinationOf('bar1', 'bar2'),
                Constraints.combinationOf('baz1', 'baz2'),
              ),
            ],
          }

          it('is satisfied when any individual .combinationOf() is fulfilled', async () => {
            const out = await parse(['--foo', 'a', '--bar1', 'b1', '--bar2', 'b2'], command)
            expect(out.flags.foo).to.equal('a')
            expect(out.flags.bar1).to.equal('b1')
            expect(out.flags.bar2).to.equal('b2')
            expect(out.flags.baz1).to.be.undefined
            expect(out.flags.baz2).to.be.undefined
          })

          it('is violated when no .combinationOf() expression is fulfilled', async () => {
            let message = ''
            try {
              await parse(['--foo', 'a', '--bar1', 'b', '--baz1', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'Flag --foo requires at least one of the following: combination of --bar1 and --bar2, combination of --baz1 and --baz2.',
            )
          })
        })
      })
    })
  })

  describe('exclusivity', () => {
    describe('.mutuallyExclusive', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flags('foo', 'bar', 'baz').are.mutuallyExclusive()],
      }

      it('is satisfied when no mutually exclusive flags are used', async () => {
        const out = await parse([], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when multiple mutually exclusive flags are used', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a', '--bar', 'b'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive: --foo, --bar, --baz. Found: --foo, --bar.',
        )
      })

      it('is satisfied when only one mutually exclusive flag is used', async () => {
        const out = await parse(['--foo', 'a'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })
    })

    describe('.exclusiveWith()', () => {
      const command = {
        flags: {
          foo: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [Constraints.flag('foo').is.exclusiveWith('bar', 'baz')],
      }

      it('is satisfied when neither excluded flag nor any excluding flags are included', async () => {
        const out = await parse([], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('is violated when excluded flag and any excluding flag are included', async () => {
        let message = ''
        try {
          await parse(['--foo', 'a', '--bar', 'b'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Flag --foo cannot be used with any of the following: --bar, --baz.')
      })

      it('is satisfied when only excluded flag is included', async () => {
        const out = await parse(['--foo', 'a'], command)
        expect(out.flags.foo).to.equal('a')
        expect(out.flags.bar).to.be.undefined
        expect(out.flags.baz).to.be.undefined
      })

      it('implies no exclusivity between excluding flags', async () => {
        const out = await parse(['--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      describe('using .combinationOf()', () => {
        describe('one .combinationOf() instance', () => {
          const command = {
            flags: {
              foo: Flags.string(),
              bar: Flags.string(),
              baz: Flags.string(),
            },
            constraints: [Constraints.flag('foo').is.exclusiveWith(Constraints.combinationOf('bar', 'baz'))],
          }

          it('is satisfied when neither excluded flag nor excluding flags are included', async () => {
            const out = await parse([], command)
            expect(out.flags.foo).to.be.undefined
            expect(out.flags.bar).to.be.undefined
            expect(out.flags.baz).to.be.undefined
          })

          it('is violated when excluded flag and all excluding flags are present', async () => {
            let message = ''
            try {
              await parse(['--foo', 'a', '--bar', 'b', '--baz', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              '--foo cannot be used with any of the following: combination of --bar and --baz.',
            )
          })

          it('is satisfied when excluded flag is present and any excluding flag is absent', async () => {
            const out = await parse(['--foo', 'a', '--bar', 'b'], command)
            expect(out.flags.foo).to.equal('a')
            expect(out.flags.bar).to.equal('b')
            expect(out.flags.baz).to.be.undefined
          })
        })

        describe('multiple .combinationOf() instances', () => {
          const command = {
            flags: {
              foo: Flags.string(),
              bar1: Flags.string(),
              bar2: Flags.string(),
              baz1: Flags.string(),
              baz2: Flags.string(),
            },
            constraints: [
              Constraints.flag('foo').is.exclusiveWith(
                Constraints.combinationOf('bar1', 'bar2'),
                Constraints.combinationOf('baz1', 'baz2'),
              ),
            ],
          }

          it('is violated when excluded flag is present and any individual .combinationOf() is fulfilled', async () => {
            let message = ''
            try {
              await parse(['--foo', 'a', '--bar1', 'b1', '--bar2', 'b2'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'Flag --foo cannot be used with any of the following: combination of --bar1 and --bar2, combination of --baz1 and --baz2.',
            )
          })

          it('is satisfied when excluded flag is present but no individual .combinationOf() is fulfilled', async () => {
            const out = await parse(['--foo', 'a', '--bar1', 'b1', '--baz1', 'c1'], command)
            expect(out.flags.foo).to.equal('a')
            expect(out.flags.bar1).to.equal('b1')
            expect(out.flags.bar2).to.be.undefined
            expect(out.flags.baz1).to.equal('c1')
            expect(out.flags.baz2).to.be.undefined
          })
        })
      })
    })
  })

  describe('simple conditionality', () => {
    describe('.allFlagCriteriaSatisfied()', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .when.allFlagCriteriaSatisfied({
              bar: (v: string) => v === 'b',
              baz: (v: string) => v === 'c',
            }),
        ],
      }

      it('criteria satisfaction is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('constraint is applied when all flag criteria are satisfied', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is not applied when any flag criterion is unsatisfied', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'yeet'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('yeet')
      })
    })

    describe('.anyFlagCriterionSatisfied()', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .when.anyFlagCriterionSatisfied({
              bar: (v: string) => v === 'b',
              baz: (v: string) => v === 'c',
            }),
        ],
      }

      it('criteria satisfaction is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('constraint is applied when any flag criterion is satisfied', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'yeet'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is not applied when no flag criteria are satisfied', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'yeet', '--baz', 'otherYeet'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('yeet')
        expect(out.flags.baz).to.equal('otherYeet')
      })
    })

    describe('.thisIsTrue()', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .when.thisIsTrue((flags) => flags.bar === flags.baz),
        ],
      }

      it('conditional is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'v', '--baz', 'v'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('v')
        expect(out.flags.baz).to.equal('v')
      })

      it('constraint is applied when the conditional returns true', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'v', '--baz', 'v'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is not applied when the conditional method returns false', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })
    })

    describe('.unless is the inversion of .when', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .unless.thisIsTrue((flags) => flags.bar === flags.baz),
        ],
      }

      it('conditional is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('constraint is NOT applied when inverted conditional is satisfied', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'v', '--baz', 'v'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('v')
        expect(out.flags.baz).to.equal('v')
      })

      it('constraint is applied when inverted conditional is unsatisfied', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })
    })
  })

  describe('logical operators', () => {
    describe('.and', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .when.thisIsTrue((flags) => flags.bar !== flags.baz)
            .and.thisIsTrue((flags) => flags.bar === 'b'),
        ],
      }

      it('subclause verity is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('constraint is applied when both subclauses are true', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is not applied when the left subclause is false', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'b'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('b')
      })

      it('constraint is not applied when the right subclause is false', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'notB', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('notB')
        expect(out.flags.baz).to.equal('c')
      })
    })

    describe('.or', () => {
      const command = {
        flags: {
          foo1: Flags.string(),
          foo2: Flags.string(),
          bar: Flags.string(),
          baz: Flags.string(),
        },
        constraints: [
          Constraints.flags('foo1', 'foo2')
            .are.mutuallyExclusive()
            .when.thisIsTrue((flags) => flags.bar !== flags.baz)
            .or.thisIsTrue((flags) => flags.bar === 'b'),
        ],
      }

      it('subclause verity is irrelevant when constraint is not violated', async () => {
        const out = await parse(['--foo1', 'a1', '--bar', 'b', '--baz', 'c'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.be.undefined
        expect(out.flags.bar).to.equal('b')
        expect(out.flags.baz).to.equal('c')
      })

      it('constraint is applied if only the left subclause is true', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'notB', '--baz', 'c'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is applied if only the right subclause is true', async () => {
        let message = ''
        try {
          await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'b'], command)
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(
          'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
        )
      })

      it('constraint is not applied when neither subclause is true', async () => {
        const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'notB', '--baz', 'notB'], command)
        expect(out.flags.foo1).to.equal('a1')
        expect(out.flags.foo2).to.equal('a2')
        expect(out.flags.bar).to.equal('notB')
        expect(out.flags.baz).to.equal('notB')
      })
    })

    describe('groupings', () => {
      describe('ops within same .when-chain are evaluated left-to-right', () => {
        describe('.when.A.and.B.or.C === (A && B) || C', () => {
          const command = {
            flags: {
              foo1: Flags.string(),
              foo2: Flags.string(),
              bar: Flags.string(),
              baz: Flags.string(),
            },
            constraints: [
              Constraints.flags('foo1', 'foo2')
                .are.mutuallyExclusive()
                .when.thisIsTrue((flags) => flags.bar !== flags.baz)
                .and.thisIsTrue((flags) => flags.bar === 'b')
                .or.thisIsTrue((flags) => flags.baz === 'c'),
            ],
          }

          it('constraint is not applied when only A is true', async () => {
            const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'notB', '--baz', 'antiC'], command)
            expect(out.flags.foo1).to.equal('a1')
            expect(out.flags.foo2).to.equal('a2')
            expect(out.flags.bar).to.equal('notB')
            expect(out.flags.baz).to.equal('antiC')
          })

          it('constraint is applied when A and B are true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'antiC'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })

          it('constraint is applied when only C is true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'c', '--baz', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })
        })

        describe('.when.A.or.B.and.C === (A || B) && C', () => {
          const command = {
            flags: {
              foo1: Flags.string(),
              foo2: Flags.string(),
              bar: Flags.string(),
              baz: Flags.string(),
            },
            constraints: [
              Constraints.flags('foo1', 'foo2')
                .are.mutuallyExclusive()
                .when.thisIsTrue((flags) => flags.bar === flags.baz)
                .or.thisIsTrue((flags) => flags.bar === 'b')
                .and.thisIsTrue((flags) => flags.baz === 'c'),
            ],
          }

          it('constraint is applied when A and C are true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'c', '--baz', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })

          it('constraint is applied when B and C are true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })

          it('constraint is not applied when only A and B are true', async () => {
            const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'b'], command)
            expect(out.flags.foo1).to.equal('a1')
            expect(out.flags.foo2).to.equal('a2')
            expect(out.flags.bar).to.equal('b')
            expect(out.flags.baz).to.equal('b')
          })

          it('constraint is not applied when only C is true', async () => {
            const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'notB', '--baz', 'c'], command)
            expect(out.flags.foo1).to.equal('a1')
            expect(out.flags.foo2).to.equal('a2')
            expect(out.flags.bar).to.equal('notB')
            expect(out.flags.baz).to.equal('c')
          })
        })
      })

      describe('additional .when-chains can be used to form additional groupings', () => {
        describe('.when.A.and.when.B.or.C === A && (B || C)', () => {
          const command = {
            flags: {
              foo1: Flags.string(),
              foo2: Flags.string(),
              bar: Flags.string(),
              baz: Flags.string(),
            },
            constraints: [
              Constraints.flags('foo1', 'foo2')
                .are.mutuallyExclusive()
                .when.thisIsTrue((flags) => flags.bar === flags.baz)
                .and.when.thisIsTrue((flags) => flags.bar === 'b')
                .or.thisIsTrue((flags) => flags.baz === 'c'),
            ],
          }

          it('constraint is applied when A and B are true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'b'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })

          it('constraint is applied when A and C are true', async () => {
            let message = ''
            try {
              await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'c', '--baz', 'c'], command)
            } catch (error: any) {
              message = error.message
            }

            expect(message).to.include(
              'The following flags are mutually exclusive under current circumstances: --foo1, --foo2. Found: --foo1, --foo2.',
            )
          })

          it('constraint is not applied when only A is true', async () => {
            const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'yeet', '--baz', 'yeet'], command)
            expect(out.flags.foo1).to.equal('a1')
            expect(out.flags.foo2).to.equal('a2')
            expect(out.flags.bar).to.equal('yeet')
            expect(out.flags.baz).to.equal('yeet')
          })

          it('constraint is not applied when only B is true', async () => {
            const out = await parse(['--foo1', 'a1', '--foo2', 'a2', '--bar', 'b', '--baz', 'antiC'], command)
            expect(out.flags.foo1).to.equal('a1')
            expect(out.flags.foo2).to.equal('a2')
            expect(out.flags.bar).to.equal('b')
            expect(out.flags.baz).to.equal('antiC')
          })
        })
      })
    })
  })
})
