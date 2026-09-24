import type { EndorsementRequest, EndorsementTranslation } from '../entity/endorsement.entity';
import type { DynamicDataConfigItem, Mapping } from '../model/mapping.model';

type ResolvedData = Record<string, unknown> & EndorsementRequest;

export class EndorsementMapper {
  toTranslation(input: EndorsementRequest, mapping: Mapping): EndorsementTranslation {
    const data = { ...mapping.defaults, ...input } as ResolvedData;
    for (const [key, defaultValue] of Object.entries(mapping.defaults)) {
      if ((data[key] === undefined || data[key] === null || data[key] === '') && defaultValue !== undefined) {
        data[key] = defaultValue;
      }
    }
    const dynamicData = mapping.dynamicDataConfig.map((config) => ({
      etiqueta: config.etiqueta,
      value: this.resolveConfigValue(config, data),
    }));

    const response: EndorsementTranslation = {
      policyNumber: String(data.policyNumber ?? ''),
      idEnvio: Number.parseInt(String(data.idEnvio ?? ''), 10),
      financialPlansEntity: { description: String(data.frecuencia ?? '') },
      currency: { description: String(data.moneda ?? '') },
      productEntity: { description: String(data.producto ?? '') },
      eventEntity: {
        description: mapping.eventDescription,
        dynamicData,
      },
      eventAppliedEntities: mapping.eventAppliedEntities,
      riskUnitEntities: [{
        insuranceObjectEntities: [{
          insuranceObjectNumber: '1',
          coverageEntities: [],
          participationEntities: [],
        }],
        plansEntity: { description: String(data.plan ?? '') },
        riskUnitNumber: '1',
      }],
      participationEntities: [],
    };
    console.log('GENERATED ENDORSEMENT RESPONSE:', JSON.stringify(response, null, 2));
    return response;
  }

  private resolveConfigValue(config: DynamicDataConfigItem, data: ResolvedData): string {
    if (Object.prototype.hasOwnProperty.call(config, 'value')) {
      return String(config.value ?? '');
    }
    if (config.source) {
      const sourceValue = this.readPath(data, config.source);
      if (sourceValue !== undefined && sourceValue !== null && String(sourceValue) !== '') {
        return String(sourceValue);
      }
    }
    return String(config.default ?? '');
  }

  private readPath(data: Record<string, unknown>, path: string): unknown {
    const normalizedPath = path.startsWith('input.') ? path.slice('input.'.length) : path;
    return normalizedPath.split('.').reduce<unknown>((value, key) => {
      if (value && typeof value === 'object' && key in value) {
        return (value as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
  }
}
