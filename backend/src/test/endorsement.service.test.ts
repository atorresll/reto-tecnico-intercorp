import { strict as assert } from 'node:assert';
import test from 'node:test';
import type { EndorsementRequest } from '../entity/endorsement.entity';
import { EndorsementMapper } from '../mapper/endorsement.mapper';
import type { Mapping } from '../model/mapping.model';
import { EndorsementService } from '../service/endorsement.service';
import {
  InvalidMappingTemplateError,
  MissingTemplateFieldsError,
} from '../service/endorsement.service';

const input: EndorsementRequest = {
  policyNumber: 'ABC1234567', idEnvio: '10', frecuencia: 'MENSUAL', tipoEndoso: 'CAMBIO',
  producto: 'VIDA', plan: 'PLUS', moneda: 'PEN', usuario: 'user@example.com',
  fechaSolicitud: '2026-01-01', fechaCliente: '2026-01-02', fechaEfectiva: '2026-01-03',
};

test('traduce un endoso usando la equivalencia del repositorio', async () => {
  const mapping: Mapping = {
    defaults: { moneda: 'PEN' },
    dynamicDataConfig: [
      { etiqueta: 'Producto', source: 'input.producto', default: 'UNKNOWN' },
      { etiqueta: 'Canal', value: 'WEB' },
    ],
    eventDescription: 'SolicitarEndoso',
    eventAppliedEntities: [{ description: 'SolicitarEndoso', orderEvent: 1 }],
  };
  const service = new EndorsementService({
    async findByProductAndEndorsementType(product, type) {
      assert.equal(product, 'VIDA');
      assert.equal(type, 'CAMBIO');
      return mapping;
    },
  });
  const result = await service.translate(input);
  assert.equal(result.idEnvio, 10);
  assert.equal(result.productEntity.description, 'VIDA');
  assert.equal(result.eventEntity.dynamicData[0].value, 'VIDA');
  assert.equal(result.eventEntity.dynamicData[1].value, 'WEB');
});

test('rechaza una plantilla sin secciones obligatorias', async () => {
  const service = new EndorsementService({
    async findByProductAndEndorsementType() {
      return {
        defaults: {},
        dynamicDataConfig: [],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [],
      };
    },
  });

  await assert.rejects(
    service.translate(input),
    (error: unknown) => error instanceof InvalidMappingTemplateError
      && error.message.includes('[dynamicDataConfig / eventAppliedEntities]'),
  );
});

test('rechaza campos requeridos por la plantilla que no llegan en el input', async () => {
  const service = new EndorsementService({
    async findByProductAndEndorsementType() {
      return {
        defaults: {},
        dynamicDataConfig: [
          { etiqueta: 'Código externo', source: 'input.codigoExterno' },
        ],
        eventDescription: 'SolicitarEndoso',
        eventAppliedEntities: [{ description: 'SolicitarEndoso', orderEvent: 1 }],
      };
    },
  });

  await assert.rejects(
    service.translate(input),
    (error: unknown) => error instanceof MissingTemplateFieldsError
      && error.message.includes('[codigoExterno]'),
  );
});
