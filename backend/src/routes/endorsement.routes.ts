import type { Server } from '@hapi/hapi';
import { createEndorsementController } from '../controller/endorsement.controller';
import { EndorsementService } from '../service/endorsement.service';
import type { MappingRepository } from '../repository/mapping.repository';

export function registerEndorsementRoutes(server: Server, repository: MappingRepository): void {
  const controller = createEndorsementController(new EndorsementService(repository));
  server.route({
    method: 'POST',
    path: '/v1/endorse/translate',
    options: { payload: { parse: true, allow: 'application/json' } },
    handler: controller,
  });
}
