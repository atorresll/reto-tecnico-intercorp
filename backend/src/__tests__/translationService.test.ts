import { describe, expect, it } from 'vitest';
import type { EndorsementRequest } from '../entity/endorsement.entity';
import {
  EndorsementService,
  InvalidMappingTemplateError,
  MissingTemplateFieldsError,
} from '../service/endorsement.service';

const input: EndorsementRequest = {
  policyNumber: '08200000049',
  idEnvio: '5984',
  frecuencia: 'Semestral',
  tipoEndoso: 'CambioFrecuencia',
  producto: 'Rumbo',
  plan: 'PlanRumbo',
  moneda: 'Nuevo Sol',
  usuario: 'interface.servicios',
  fechaSolicitud: '2025-08-27',
  fechaCliente: '2025-08-27',
  fechaEfectiva: '2025-09-01',
};

describe('EndorsementService', () => {
  it('transforma el input y conserva el orden de dynamicDataConfig', async () => {
    const service = new EndorsementService({
      findByProductAndEndorsementType: async () => ({
        defaults: {},
        dynamicDataConfig: [
          { etiqueta: 'Usuario', source: 'input.usuario' },
          { etiqueta: 'Constante', value: 'SAC' },
          { etiqueta: 'Póliza', source: 'input.policyNumber' },
        ],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [
          { description: 'SolicitarEndoso', orderEvent: 1 },
          { description: 'AprobarEndoso', orderEvent: 2 },
        ],
      }),
    });

    const result = await service.translate(input);

    expect(result.idEnvio).toBe(5984);
    expect(result.eventEntity.dynamicData).toEqual([
      { etiqueta: 'Usuario', value: 'interface.servicios' },
      { etiqueta: 'Constante', value: 'SAC' },
      { etiqueta: 'Póliza', value: '08200000049' },
    ]);
    expect(result.eventAppliedEntities).toEqual([
      { description: 'SolicitarEndoso', orderEvent: 1 },
      { description: 'AprobarEndoso', orderEvent: 2 },
    ]);
  });

  it('rechaza una plantilla inválida con error 422', async () => {
    const service = new EndorsementService({
      findByProductAndEndorsementType: async () => ({
        defaults: {},
        dynamicDataConfig: [],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [],
      }),
    });

    await expect(service.translate(input)).rejects.toBeInstanceOf(InvalidMappingTemplateError);
    await expect(service.translate(input)).rejects.toMatchObject({
      message: expect.stringContaining('dynamicDataConfig / eventAppliedEntities'),
    });
  });

  it('rechaza campos de input faltantes con error 400', async () => {
    const service = new EndorsementService({
      findByProductAndEndorsementType: async () => ({
        defaults: {},
        dynamicDataConfig: [{ etiqueta: 'Póliza', source: 'input.policyNumber' }],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [{ description: 'SolicitarEndoso', orderEvent: 1 }],
      }),
    });

    await expect(service.translate({ ...input, policyNumber: '' }))
      .rejects.toBeInstanceOf(MissingTemplateFieldsError);
    await expect(service.translate({ ...input, policyNumber: '' }))
      .rejects.toMatchObject({ message: expect.stringContaining('[policyNumber]') });
  });

  it('usa defaults cuando falta frecuencia en el input', async () => {
    const service = new EndorsementService({
      findByProductAndEndorsementType: async () => ({
        defaults: { frecuencia: 'Semestral' },
        dynamicDataConfig: [{ etiqueta: 'Frecuencia', source: 'input.frecuencia' }],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [{ description: 'SolicitarEndoso', orderEvent: 1 }],
      }),
    });

    await expect(service.translate({ ...input, frecuencia: '' })).resolves.toMatchObject({
      financialPlansEntity: { description: 'Semestral' },
    });
  });
});
