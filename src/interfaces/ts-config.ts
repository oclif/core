export interface TSConfig {
  compilerOptions: {
    rootDir?: string;
    rootDirs?: string[];
    outDir?: string;
    target?: string;
    esModuleInterop?: boolean;
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
    module?: string;
    moduleResolution?: string;
    sourceMap?: boolean;
    jsx?: boolean;
  };
  'ts-node'?: {
    esm?: boolean;
    experimentalSpecifierResolution?: 'node' | 'explicit';
    scope?: boolean;
  }
}
