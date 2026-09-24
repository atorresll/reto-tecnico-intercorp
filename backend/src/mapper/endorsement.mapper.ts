import { randomUUID } from 'node:crypto';
import type { EndorsementRequest, EndorsementTranslation } from '../entity/endorsement.entity';
import type { Mapping } from '../model/mapping.model';

export class EndorsementMapper {
  toTranslation(input: EndorsementRequest, mapping: Mapping): EndorsementTranslation {
    const translatedFields = Object.entries(mapping.translation).reduce<Record<string, unknown>>(
      (output, [targetField, sourceField]) => {
        if (typeof sourceField === 'string' && sourceField in input) {
          output[targetField] = input[sourceField as keyof EndorsementRequest];
        } else {
          output[targetField] = sourceField;
        }
        return output;
      },
      {},
    );

    for (const [field, allowedValues] of Object.entries(mapping.lists)) {
      const value = input[field as keyof EndorsementRequest];
      if (value !== undefined && !allowedValues.includes(String(value))) {
        throw new Error(`Valor no permitido para ${field}`);
      }
    }

    return {
      id: randomUUID(),
      status: 'translated',
      policyNumber: input.policyNumber,
      idEnvio: input.idEnvio,
      producto: input.producto,
      tipoEndoso: input.tipoEndoso,
      translation: { ...translatedFields, ...mapping.rules },
    };
  }
}
