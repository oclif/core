export interface TSConfig {
  compilerOptions: {
    rootDir?: string;
    rootDirs?: string[];
    outDir?: string;
    target?: string;
    esModuleInterop?: boolean;
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
  };
}
