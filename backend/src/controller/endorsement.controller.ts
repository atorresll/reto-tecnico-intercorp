import type { Request, ResponseToolkit } from '@hapi/hapi';
import { z } from 'zod';
import type { EndorsementRequest } from '../entity/endorsement.entity';
import { EndorsementService } from '../service/endorsement.service';

const requestSchema = z.object({
  policyNumber: z.string().min(10).regex(/^[a-zA-Z0-9]+$/),
  idEnvio: z.string().min(1, 'El ID de envío es obligatorio'),
  frecuencia: z.string().min(1),
  tipoEndoso: z.string().min(1),
  producto: z.string().min(1),
  plan: z.string().min(1),
  moneda: z.string().min(1),
  usuario: z.string().min(1, 'El usuario es obligatorio'),
  fechaSolicitud: z.string().min(1),
  fechaCliente: z.string().min(1),
  fechaEfectiva: z.string().min(1),
});

export function createEndorsementController(service: EndorsementService) {
  return async (request: Request, h: ResponseToolkit) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
    };
    try {
      const parsed = requestSchema.safeParse(request.payload);
      if (!parsed.success) {
        return h.response({
          message: 'Payload de endoso inválido',
          details: parsed.error.flatten(),
        }).code(400).header('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
          .header('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
          .header('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      }
      const result = await service.translate(parsed.data as EndorsementRequest);
      return h.response(result).code(200)
        .header('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
        .header('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
        .header('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    } catch (error) {
      request.server.log(
        ['error', 'endorsement'],
        error instanceof Error ? error.message : String(error),
      );
      return h.response({
        message: 'Error al procesar el endoso o registro no encontrado',
      }).code(400)
        .header('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
        .header('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
        .header('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    }
  };
}
