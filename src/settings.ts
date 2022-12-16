export type Settings = {
  /**
   * Show additional debug output without DEBUG. Mainly shows stackstraces.
   *
   * Useful to set in the ./bin/dev script.
   * oclif.settings.debug = true;
   */
  debug?: boolean;
  /**
   * The path to the error.log file.
   *
   * NOTE: This is read-only and setting it will have no effect.
   */
  errlog?: string;
  /**
   * Set the terminal width to a specified number of columns (characters)
   *
   * Environment Variable:
   *   OCLIF_COLUMNS=80
   */
  columns?: number;

};

// Set global.oclif to the new object if it wasn't set before
if (!(global as any).oclif) (global as any).oclif = {}

export const settings: Settings = (global as any).oclif as Settings
