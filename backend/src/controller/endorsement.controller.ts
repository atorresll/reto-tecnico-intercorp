import Boom from '@hapi/boom';
import type { Request, ResponseToolkit } from '@hapi/hapi';
import { z } from 'zod';
import type { EndorsementRequest } from '../entity/endorsement.entity';
import { EndorsementService } from '../service/endorsement.service';

const requestSchema = z.object({
  policyNumber: z.string().min(10).regex(/^[a-zA-Z0-9]+$/),
  idEnvio: z.number().int().positive(),
  frecuencia: z.string().min(1),
  tipoEndoso: z.string().min(1),
  producto: z.string().min(1),
  plan: z.string().min(1),
  moneda: z.string().min(1),
  usuario: z.string().email(),
  fechaSolicitud: z.string().min(1),
  fechaCliente: z.string().min(1),
  fechaEfectiva: z.string().min(1),
});

export function createEndorsementController(service: EndorsementService) {
  return async (request: Request, h: ResponseToolkit) => {
    const parsed = requestSchema.safeParse(request.payload);
    if (!parsed.success) {
      throw Boom.badRequest('Payload de endoso inválido', { details: parsed.error.flatten() });
    }
    const result = await service.translate(parsed.data as EndorsementRequest);
    return h.response(result).code(200);
  };
}
