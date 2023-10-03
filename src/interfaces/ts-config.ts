export interface TSConfig {
  compilerOptions: {
    emitDecoratorMetadata?: boolean
    esModuleInterop?: boolean
    experimentalDecorators?: boolean
    jsx?: boolean
    module?: string
    moduleResolution?: string
    outDir?: string
    rootDir?: string
    rootDirs?: string[]
    sourceMap?: boolean
    target?: string
  }
  'ts-node'?: {
    esm?: boolean
    experimentalSpecifierResolution?: 'explicit' | 'node'
    scope?: boolean
  }
}
