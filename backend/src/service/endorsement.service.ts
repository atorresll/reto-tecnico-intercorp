import type { EndorsementRequest, EndorsementTranslation } from '../entity/endorsement.entity';
import type { MappingRepository } from '../repository/mapping.repository';
import { EndorsementMapper } from '../mapper/endorsement.mapper';
import type { DynamicDataConfigItem, Mapping } from '../model/mapping.model';

const INVALID_TEMPLATE_MESSAGE =
  'La plantilla configurada en DynamoDB para este producto/tipoEndoso no contiene las secciones requeridas [dynamicDataConfig / eventAppliedEntities]';

export class InvalidMappingTemplateError extends Error {
  constructor() {
    super(INVALID_TEMPLATE_MESSAGE);
    this.name = 'InvalidMappingTemplateError';
  }
}

export class MissingTemplateFieldsError extends Error {
  constructor(public readonly fields: string[]) {
    super(
      `No se puede procesar el endoso. Faltan los siguientes campos requeridos por la plantilla: [${fields.join(', ')}]`,
    );
    this.name = 'MissingTemplateFieldsError';
  }
}

export class EndorsementService {
  constructor(
    private readonly mappingRepository: MappingRepository,
    private readonly mapper = new EndorsementMapper(),
  ) {}

  async translate(input: EndorsementRequest): Promise<EndorsementTranslation> {
    const mapping = await this.mappingRepository.findByProductAndEndorsementType(
      input.producto,
      input.tipoEndoso,
    );
    this.validateTemplate(mapping);
    const missingFields = this.findMissingFields(input, mapping);
    if (missingFields.length > 0) {
      throw new MissingTemplateFieldsError(missingFields);
    }
    return this.mapper.toTranslation(input, mapping);
  }

  private validateTemplate(mapping: Mapping): void {
    if (
      !Array.isArray(mapping.dynamicDataConfig)
      || mapping.dynamicDataConfig.length === 0
      || !Array.isArray(mapping.eventAppliedEntities)
      || mapping.eventAppliedEntities.length === 0
      || mapping.dynamicDataConfig.some((config) => !this.isValidConfig(config))
    ) {
      throw new InvalidMappingTemplateError();
    }
  }

  private isValidConfig(config: DynamicDataConfigItem): boolean {
    if (!config || typeof config.etiqueta !== 'string' || config.etiqueta.trim() === '') {
      return false;
    }
    const hasSource = typeof config.source === 'string' && config.source.trim() !== '';
    const hasValue = Object.prototype.hasOwnProperty.call(config, 'value');
    return hasSource || hasValue;
  }

  private findMissingFields(
    input: EndorsementRequest,
    mapping: Mapping,
  ): string[] {
    const missingFields = new Set<string>();
    for (const config of mapping.dynamicDataConfig) {
      if (!config.source?.startsWith('input.')) continue;

      const fieldPath = config.source.slice('input.'.length);
      if (
        !this.hasValueAtPath(input, fieldPath)
        && !this.hasValueAtPath(mapping.defaults, fieldPath)
        && !Object.prototype.hasOwnProperty.call(config, 'default')
      ) {
        missingFields.add(fieldPath);
      }
    }
    return [...missingFields];
  }

  private hasValueAtPath(data: object, path: string): boolean {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
    return value !== undefined && value !== null && value !== '';
  }
}
