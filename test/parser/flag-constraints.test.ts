describe('flag constraints tests', () => {
  describe('requirement constraints', () => {
    describe('.requiredAll()', () => {
      it('is satisfied when all flags are included', async () => {})

      it('is not satisfied when any flag is absent', async () => {})
    })

    describe('.requiredAny()', () => {
      it('is satisfied when any flag is included', async () => {})

      it('is not satisfied when no flags are included', async () => {})
    })

    describe('.requiredExactlyN()', () => {
      it('is satisfied when exactly N flags are present', async () => {})

      it('is not satisfied when fewer than N flags are present', async () => {})

      it('is not satisfied when more than N flags are present', async () => {})
    })

    describe('.requiredAtLeastN()', () => {
      it('is satisfied when exactly N flags are present', async () => {})

      it('is not satisfied when fewer than N flags are present', async () => {})

      it('is satisfied when more than N flags are present', async () => {})
    })

    describe('.requiredAtMostN()', () => {
      it('is satisfied when exactly N flags are present', async () => {})

      it('is satisfied when fewer than N flags are present', async () => {})

      it('is not satisfied when more than N flags are present', async () => {})
    })
  })

  describe('dependency', () => {
    describe('.mutuallyDependent', () => {
      it('is satisfied when no mutually dependent flags are included', async () => {})

      it('is satisfied when all mutually dependent flags are included', async () => {})

      it('is not satisfied when only some mutually dependent flags are included', async () => {})
    })

    describe('.dependentOn()', () => {
      it('is satisfied when neither dependant nor any dependees are included', async () => {})

      it('is satisfied when both dependant and at least one dependee are included', async () => {})

      it('is not satisfied when dependant is included with no dependees', async () => {})

      it('implies no relationship between dependees', async () => {})

      describe('in combination with .allOf()', async () => {
        it('is satisfied when neither dependant nor dependees are included', async () => {})

        it('is satisfied when all dependees are included', async () => {})

        it('is not satisfied when any dependee is absent', async () => {})
      })
    })
  })

  describe('exclusivity', () => {
    describe('.mutuallyExclusive', () => {
      it('is satisfied when no mutually exclusive flags are used', async () => {})

      it('is not satisfied when multiple mutually exclusive flags are used', async () => {})

      it('is satisfied when only one mutually exclusive flag is used', async () => {})
    })

    describe('.exclusiveWith()', () => {
      it('is satisfied when neither dependant nor any dependees are included', async () => {})

      it('is not satisfied when both dependant and any dependee are included', async () => {})

      it('is satisfied when only dependant is included', async () => {})

      it('implies no relationship between dependees', async () => {})

      describe('in combination with .allOf()', async () => {
        it('is satisfied when neither dependant nor dependees are included', async () => {})

        it('is not satisfied when all dependees are included', async () => {})

        it('is satisfied when any dependee is absent', async () => {})
      })
    })
  })

  describe('simple conditionality', () => {
    describe('.allFlagCriteriaSatisfied()', () => {
      it('is satisfied when all flag constraints are satisfied', async () => {})

      it('is not satisfied when any flag constraint is not satisfied', async () => {})
    })

    describe('.anyFlagCriteriaSatisfied()', () => {
      it('is satisfied when any flag constraint is satisfied', async () => {})

      it('is not satisfied when no flag constraints are satisfied', async () => {})
    })

    describe('.thisIsTrue()', () => {
      it('is satisfied when the provided method returns true', async () => {})

      it('is not satisfied when the provided method returns false', async () => {})
    })
  })

  describe('logical operators', () => {
    describe('.and', () => {
      it('is satisfied when both subclauses are true', async () => {})

      it('is not satisfied when the left subclause is false', async () => {})

      it('is not satisfied when the right subclause is false', async () => {})
    })

    describe('.or', () => {
      it('is satisfied when only the left subclause is true', async () => {})

      it('is satisfied when only the right subclause is true', async () => {})

      it('is not satisfied when neither subclause is true', async () => {})
    })

    describe('groupings', () => {
      describe('ops within same .when-chain are evaluated left-to-right', () => {
        describe('.when.A.and.B.or.C === (A && B) || C', () => {
          it('false when only A is true', async () => {})

          it('true when A and B are true', async () => {})

          it('true when only C is true', async () => {})
        })

        describe('.when.A.or.B.and.C === (A || B) && C', () => {
          it('true when A and C are true', async () => {})

          it('true when B and C are true', async () => {})

          it('false when only A and B are true', async () => {})

          it('false when only C is true', async () => {})
        })
      })

      describe('additional .when-chains can be used to form additional groupings', () => {
        describe('.when.A.and.when.B.or.C === A && (B || C)', () => {
          it('true when A and B are true', async () => {})

          it('true when A and C are true', async () => {})

          it('false when only A is true', async () => {})

          it('false when only B is true', async () => {})
        })
      })
    })
  })
})
