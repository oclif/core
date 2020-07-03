// tslint:disable

declare namespace NodeJS {
  interface Global {
    oclif?: {
      debug?: boolean;
      errlog?: string;
    };
  }
}
