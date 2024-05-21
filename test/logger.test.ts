import {expect} from 'chai'
import sinon from 'sinon'

import {Config} from '../src/config/config'
import {clearLoggers, getLogger, setLogger} from '../src/logger'

describe('getLogger', () => {
  let childStub: sinon.SinonStub
  let config: Config

  beforeEach(async () => {
    clearLoggers()
    childStub = sinon
      .stub()
      .callsFake((ns: string, delimiter?: string) => customLogger(`MY_CLI${delimiter ?? ':'}${ns}`))
    const customLogger = (namespace: string) => ({
      child: childStub,
      debug(_formatter: unknown, ..._args: unknown[]) {},
      error(_formatter: unknown, ..._args: unknown[]) {},
      info(_formatter: unknown, ..._args: unknown[]) {},
      trace(_formatter: unknown, ..._args: unknown[]) {},
      warn(_formatter: unknown, ..._args: unknown[]) {},
      namespace,
    })

    config = await Config.load({
      root: __dirname,
      logger: customLogger('MY_CLI'),
    })
    setLogger(config)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return the root logger if no namespace is provided', () => {
    const logger = getLogger()
    expect(logger.namespace).to.equal('MY_CLI')
  })

  it('should create a new logger if the namespace has not been created', () => {
    const logger = getLogger('test')
    expect(logger.namespace).to.equal('MY_CLI:test')
    expect(childStub.withArgs('test').callCount).to.equal(1)
  })

  it('should return a cached logger if the namespace has already been created', () => {
    getLogger('test')
    expect(childStub.withArgs('test').callCount, 'first getLogger call should call .child()').to.equal(1)

    const logger = getLogger('test')

    expect(logger.namespace).to.equal('MY_CLI:test')
    expect(childStub.withArgs('test').callCount, 'second getLogger call should not call .child()').to.equal(1)
  })

  it('should return default oclif logger if no custom logger is set', async () => {
    clearLoggers()
    const logger = getLogger()
    expect(logger.namespace).to.equal('oclif')
  })
})

describe('setLogger', () => {
  const customLogger = (namespace: string) => ({
    child: (ns: string, delimiter?: string) => customLogger(`${namespace}${delimiter ?? ':'}${ns}`),
    debug(_formatter: unknown, ..._args: unknown[]) {},
    error(_formatter: unknown, ..._args: unknown[]) {},
    info(_formatter: unknown, ..._args: unknown[]) {},
    trace(_formatter: unknown, ..._args: unknown[]) {},
    warn(_formatter: unknown, ..._args: unknown[]) {},
    namespace,
  })

  beforeEach(async () => {
    clearLoggers()
  })

  it('should set the logger to the custom logger provided in loadOptions', async () => {
    const config = await Config.load({
      root: __dirname,
      logger: customLogger('MY_CLI'),
    })
    setLogger(config)

    const logger = getLogger()
    expect(logger.namespace).to.equal('MY_CLI')
  })

  it('should set the logger to the default oclif logger if no custom logger is provided', async () => {
    const config = await Config.load({
      root: __dirname,
    })
    setLogger(config)

    const logger = getLogger()
    expect(logger.namespace).to.equal('oclif')
  })

  it('should use default logger if the provided logger does not match the Logger interface', async () => {
    const logger = customLogger('MY_CLI')
    // @ts-expect-error because we are testing an invalid logger interface
    delete logger.child
    const config = await Config.load({
      root: __dirname,
      logger,
    })
    setLogger(config)
    const oclifLogger = getLogger()
    expect(oclifLogger.namespace).to.equal('oclif')
  })
})
