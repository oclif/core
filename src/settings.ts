export type Settings = {
  /**
   * Set the terminal width to a specified number of columns (characters)
   *
   * Environment Variable:
   *   OCLIF_COLUMNS=80
   */
  columns?: number
  /**
   * Show additional debug output without DEBUG. Mainly shows stackstraces.
   *
   * Useful to set in the ./bin/dev.js script.
   * oclif.settings.debug = true;
   */
  debug?: boolean
  /**
   * The path to the error.log file.
   *
   * NOTE: This is read-only and setting it will have no effect.
   */
  errlog?: string
  /**
   * Enable performance tracking. Resulting data is available in the `perf` property of the `Config` class.
   * This will be overridden by the `enablePerf` property passed into Config constructor.
   */
  performanceEnabled?: boolean
  /**
   * Try to use ts-node to load typescript source files instead of javascript files.
   * Defaults to true in development and test environments (e.g. using bin/dev.js or
   * NODE_ENV=development or NODE_ENV=test).
   *
   * @deprecated use enableAutoTranspile instead.
   */
  tsnodeEnabled?: boolean
  /**
   * Enable automatic transpilation of TypeScript files to JavaScript.
   *
   * Defaults to true in development and test environments (e.g. using bin/dev.js or NODE_ENV=development or NODE_ENV=test).
   */
  enableAutoTranspile?: boolean
}

// Set global.oclif to the new object if it wasn't set before
if (!(global as any).oclif) (global as any).oclif = {}

export const settings: Settings = (global as any).oclif as Settings
