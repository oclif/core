export interface OclifError {
  oclif: {
    exit?: number | false;
  };
}

export interface PrettyPrintableError {
  /**
   * messsage to display related to the error
   */
  message?: string;

  /**
   * a unique error code for this error class
   */
  code?: string;

  /**
   * a url to find out more information related to this error
   * or fixing the error
   */
  ref?: string;

  /**
   * a suggestion that may be useful or provide additional context
   */
  suggestions?: string[];
}
