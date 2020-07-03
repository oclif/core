export type Metadata = {
  flags: { [key: string]: MetadataFlag };
}

type MetadataFlag = {
  setFromDefault?: boolean;
}
