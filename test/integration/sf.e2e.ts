import {arch} from 'node:os'
import {expect} from 'chai'
import {Executor, setup} from './util'
import StripAnsi = require('strip-ansi')
const stripAnsi: typeof StripAnsi = require('strip-ansi')

const chalk = require('chalk')
chalk.level = 0

function parseJson(json: string) {
  return JSON.parse(stripAnsi(json))
}

describe('Salesforce CLI (sf)', () => {
  let executor: Executor
  before(async () => {
    process.env.SFDX_TELEMETRY_DISABLE_ACKNOWLEDGEMENT = 'true'
    executor = await setup(__filename, {
      repo: 'https://github.com/salesforcecli/cli',
      branch: 'mdonnalley/esm',
    })
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
    const regex = /^.*?USAGE.*?FLAGS.*?GLOBAL FLAGS.*?DESCRIPTION.*?EXAMPLES.*?FLAG DESCRIPTIONS.*?CONFIGURATION VARIABLES.*?ENVIRONMENT VARIABLES.*$/gs
    expect(regex.test(help.stdout!)).to.be.true
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
    const regex = /^.*?USAGE.*?FLAGS.*?GLOBAL FLAGS.*?(?!DESCRIPTION).*?(?!EXAMPLES).*?(?!FLAG DESCRIPTIONS).*?(?!CONFIGURATION VARIABLES).*?(?!ENVIRONMENT VARIABLES).*$/gs
    expect(regex.test(help.stdout!)).to.be.true
  })

  it('should show version using -v', async () => {
    const version = await executor.executeCommand('-v')
    expect(version.stdout).to.include('@salesforce/cli')
    expect(version.stdout).to.include(process.platform)
    expect(version.stdout).to.include(arch())
    expect(version.stdout).to.include(process.version)
  })

  it('should have formatted json success output', async () => {
    const config = await executor.executeCommand('config list --json')
    const result = parseJson(config.stdout!)
    expect(result).to.have.property('status')
    expect(result).to.have.property('result')
    expect(result).to.have.property('warnings')
  })

  it('should have formatted json error output', async () => {
    const config = await executor.executeCommand('config set DOES_NOT_EXIST --json')
    const result = parseJson(config.stdout!)
    expect(result).to.have.property('status')
    expect(result).to.have.property('stack')
    expect(result).to.have.property('name')
    expect(result).to.have.property('message')
    expect(result).to.have.property('warnings')
  })

  it('should handle varargs', async () => {
    const config = await executor.executeCommand('config set disable-telemetry=true org-api-version=54.0 --global --json')
    const parsed = parseJson(config.stdout!)
    expect(parsed.status).to.equal(0)
    const results = parsed.result as {successes: Array<{success: boolean}>, failures: Array<{failed: boolean}>}
    for (const result of results.successes) {
      expect(result.success).to.be.true
    }

    expect(results.failures).to.be.empty
  })
})
