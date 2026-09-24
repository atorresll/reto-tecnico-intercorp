import { strict as assert } from 'node:assert';
import test from 'node:test';
import type { EndorsementRequest } from '../entity/endorsement.entity';
import { EndorsementMapper } from '../mapper/endorsement.mapper';
import type { Mapping } from '../model/mapping.model';
import { EndorsementService } from '../service/endorsement.service';

const input: EndorsementRequest = {
  policyNumber: 'ABC1234567', idEnvio: 10, frecuencia: 'MENSUAL', tipoEndoso: 'CAMBIO',
  producto: 'VIDA', plan: 'PLUS', moneda: 'PEN', usuario: 'user@example.com',
  fechaSolicitud: '2026-01-01', fechaCliente: '2026-01-02', fechaEfectiva: '2026-01-03',
};

test('traduce un endoso usando la equivalencia del repositorio', async () => {
  const mapping: Mapping = {
    translation: { productCode: 'producto', endorsementCode: 'tipoEndoso' },
    rules: { channel: 'WEB' },
    lists: { moneda: ['PEN'] },
  };
  const service = new EndorsementService({
    async findByProductAndEndorsementType(product, type) {
      assert.equal(product, 'VIDA');
      assert.equal(type, 'CAMBIO');
      return mapping;
    },
  });
  const result = await service.translate(input);
  assert.equal(result.status, 'translated');
  assert.equal(result.translation.productCode, 'VIDA');
  assert.equal(result.translation.channel, 'WEB');
});
