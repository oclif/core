export interface S3Manifest {
  version: string;
  sha: string;
  gz: string;
  xz?: string;
  sha256gz: string;
  sha256xz?: string;
  baseDir: string;
  rollout?: number;
  node: {
    compatible: string;
    recommended: string;
  };
}
