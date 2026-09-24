import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'node:crypto';
import { Server } from '@hapi/hapi';

const dynamo = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME;
if (!tableName) throw new Error('TABLE_NAME environment variable is required');

const server = new Server({ port: 0 });
server.route({
  method: 'POST',
  path: '/endorse/translate',
  handler: async (request, h) => {
    const payload = request.payload as Record<string, unknown>;
    const id = randomUUID();
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        PK: { S: `ENDORSEMENT#${id}` },
        SK: { S: 'REQUEST' },
        payload: { S: JSON.stringify(payload) },
      },
    }));
    return h.response({ id, status: 'translated' }).code(201);
  },
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const response = await server.inject({
    method: event.httpMethod,
    url: event.path,
    payload: event.body
      ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body)
      : undefined,
    headers: event.headers,
  });
  return {
    statusCode: response.statusCode,
    headers: { 'content-type': 'application/json' },
    body: typeof response.result === 'string' ? response.result : JSON.stringify(response.result ?? {}),
  };
}
