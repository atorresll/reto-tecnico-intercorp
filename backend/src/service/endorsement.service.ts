import type { EndorsementRequest, EndorsementTranslation } from '../entity/endorsement.entity';
import type { MappingRepository } from '../repository/mapping.repository';
import { EndorsementMapper } from '../mapper/endorsement.mapper';

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
    return this.mapper.toTranslation(input, mapping);
  }
}
