import {expect} from 'chai'
import {Executor, setup} from './util'

describe('Salesforce CLI (sf)', () => {
  let executor: Executor
  before(async () => {
    executor = await setup(__filename, {repo: 'git@github.com:salesforcecli/cli.git'})
  })

  it('should show custom help', async () => {
    const help = await executor.executeCommand('deploy metadata --help')
    /**
     * Regex matches that the help output matches this form:
     *
     * @example
     * <summary>
     *
     * USAGE
     *   <usage>
     *
     * FLAGS
     *   <flags>
     *
     * GLOBAL FLAGS
     *   <global flags>
     *
     * DESCRIPTION
     *   <description>
     *
     * EXAMPLES
     *   <examples>
     *
     * FLAG DESCRIPTIONS
     *   <flag descriptions>
     *
     * CONFIGURATION VARIABLES
     *   <configuration variables>
     *
     * ENVIRONMENT VARIABLES
     *   <environment variables>
     */
    const regex = /^[A-Z].*\n\nUSAGE[\S\s]*\n\nFLAGS[\S\s]*\n\nGLOBAL FLAGS[\S\s]*\n\nDESCRIPTION[\S\s]*\n\nEXAMPLES[\S\s]*\n\nFLAG DESCRIPTIONS[\S\s]*\n\nCONFIGURATION VARIABLES[\S\s]*\n\nENVIRONMENT VARIABLES[\S\s]*$/g
    expect(regex.test(help.output!)).to.be.true
  })
})
