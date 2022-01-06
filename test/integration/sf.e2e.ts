import * as os from 'os'
import {expect} from 'chai'
import {Executor, setup} from './util'

describe('Salesforce CLI (sf)', () => {
  let executor: Executor
  before(async () => {
    process.env.SFDX_TELEMETRY_DISABLE_ACKNOWLEDGEMENT = 'true'
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

  it('should show custom short help', async () => {
    const help = await executor.executeCommand('deploy metadata -h')
    /**
     * Regex matches that the short help output matches this form:
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
     */
    const regex = /^[A-Z].*\n\nUSAGE[\S\s]*\n\nFLAGS[\S\s]*\n\nGLOBAL FLAGS[\S\s]*$/g
    expect(regex.test(help.output!)).to.be.true
  })

  it('should show version using -v', async () => {
    const version = await executor.executeCommand('-v')
    expect(version.output).to.include('@salesforce/cli')
    expect(version.output).to.include(process.platform)
    expect(version.output).to.include(os.arch())
    expect(version.output).to.include(process.version)
  })

  it('should have formatted json success output', async () => {
    const config = await executor.executeCommand('config list --json')
    const result = JSON.parse(config.output!)
    expect(result).to.have.property('status')
    expect(result).to.have.property('result')
    expect(result).to.have.property('warnings')
  })

  it('should have formatted json error output', async () => {
    const config = await executor.executeCommand('config set DOES_NOT_EXIST --json')
    const result = JSON.parse(config.output!)
    expect(result).to.have.property('status')
    expect(result).to.have.property('stack')
    expect(result).to.have.property('name')
    expect(result).to.have.property('message')
    expect(result).to.have.property('warnings')
  })

  it('should handle varags', async () => {
    const config = await executor.executeCommand('config set disableTelemetry=true restDeploy=true --global --json')
    const parsed = JSON.parse(config.output!)
    expect(parsed.status).to.equal(0)
    const results = parsed.result as Array<{success: boolean}>
    for (const result of results) {
      expect(result.success).to.be.true
    }
  })
})
