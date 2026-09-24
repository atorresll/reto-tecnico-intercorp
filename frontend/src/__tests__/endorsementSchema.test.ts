import { describe, expect, it } from 'vitest';
import { endorsementSchema } from '../domain/endorsementSchema';

const validInput = {
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

describe('endorsementSchema', () => {
  it('acepta el formulario válido', () => {
    expect(endorsementSchema.safeParse(validInput).success).toBe(true);
  });

  it('devuelve errores para campos requeridos vacíos', () => {
    const result = endorsementSchema.safeParse({
      ...validInput,
      policyNumber: '',
      idEnvio: '',
      usuario: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
        'String must contain at least 10 character(s)',
        'El ID de envío es obligatorio',
        'El usuario es obligatorio',
      ]));
    }
  });
});
