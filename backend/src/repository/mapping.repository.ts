import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { Mapping, MappingRecord } from '../model/mapping.model';
import { toMapping } from '../model/mapping.model';

export interface MappingRepository {
  findByProductAndEndorsementType(product: string, endorsementType: string): Promise<Mapping>;
}

export class MappingNotFoundError extends Error {
  constructor() {
    super('No existe plantilla de mapeo para este producto y tipo de endoso');
    this.name = 'MappingNotFoundError';
  }
}

export class DynamoMappingRepository implements MappingRepository {
  constructor(
    private readonly client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    }),
    private readonly tableName = process.env.TABLE_NAME,
  ) {
    if (!tableName) throw new Error('TABLE_NAME environment variable is required');
  }

  async findByProductAndEndorsementType(product: string, endorsementType: string): Promise<Mapping> {
    console.log('DYNAMODB MAPPING QUERY:', JSON.stringify({
      tableName: this.tableName,
      product,
      endorsementType,
    }));
    try {
      const result = await this.client.send(new GetItemCommand({
        TableName: this.tableName,
        Key: { PK: { S: product }, SK: { S: endorsementType } },
        ConsistentRead: true,
      }));
      if (!result.Item) throw new MappingNotFoundError();
      return toMapping(unmarshall(result.Item) as MappingRecord);
    } catch (error) {
      const executionError = error instanceof Error ? error : new Error(String(error));
      console.error('DYNAMODB QUERY ERROR:', executionError.message, executionError.stack);
      throw executionError;
    }
  }
}
