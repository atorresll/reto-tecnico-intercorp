import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { Mapping, MappingRecord } from '../model/mapping.model';
import { toMapping } from '../model/mapping.model';

export interface MappingRepository {
  findByProductAndEndorsementType(product: string, endorsementType: string): Promise<Mapping>;
}

export class DynamoMappingRepository implements MappingRepository {
  constructor(
    private readonly client = new DynamoDBClient({}),
    private readonly tableName = process.env.TABLE_NAME,
  ) {
    if (!tableName) throw new Error('TABLE_NAME environment variable is required');
  }

  async findByProductAndEndorsementType(product: string, endorsementType: string): Promise<Mapping> {
    const result = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: {
        PK: { S: `PRODUCT#${product}` },
        SK: { S: `ENDORSEMENT#${endorsementType}` },
      },
      ConsistentRead: true,
    }));
    if (!result.Item) {
      throw new Error(`No mapping found for producto=${product}, tipoEndoso=${endorsementType}`);
    }
    return toMapping(unmarshall(result.Item) as MappingRecord);
  }
}
