export interface MappingRecord {
  PK: string;
  SK: string;
  translation?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  lists?: Record<string, string[]>;
}

export interface Mapping {
  translation: Record<string, unknown>;
  rules: Record<string, unknown>;
  lists: Record<string, string[]>;
}

export function toMapping(record?: MappingRecord): Mapping {
  return {
    translation: record?.translation ?? {},
    rules: record?.rules ?? {},
    lists: record?.lists ?? {},
  };
}
