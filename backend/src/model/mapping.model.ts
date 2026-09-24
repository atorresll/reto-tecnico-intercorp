export interface MappingRecord {
  PK?: string;
  SK?: string;
  defaults?: Record<string, unknown>;
  dynamicDataConfig?: DynamicDataConfigItem[];
  eventDescription?: string;
  eventAppliedEntities?: Array<{ description: string; orderEvent: number }>;
}

export interface DynamicDataConfigItem {
  etiqueta: string;
  value?: unknown;
  source?: string;
  default?: unknown;
}

export interface Mapping {
  defaults: Record<string, unknown>;
  dynamicDataConfig: DynamicDataConfigItem[];
  eventDescription: string;
  eventAppliedEntities: Array<{ description: string; orderEvent: number }>;
}

export function toMapping(record?: MappingRecord): Mapping {
  return {
    defaults: record?.defaults ?? {},
    dynamicDataConfig: record?.dynamicDataConfig ?? [],
    eventDescription: record?.eventDescription ?? '',
    eventAppliedEntities: record?.eventAppliedEntities ?? [],
  };
}
