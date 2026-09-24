import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Server } from '@hapi/hapi';
import { registerEndorsementRoutes } from './routes/endorsement.routes';
import { DynamoMappingRepository } from './repository/mapping.repository';

type ServerlessExpressFactory = <TEvent, TResult>(options: {
  app: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
}) => Handler<TEvent, TResult>;

const serverlessExpressModule = require('@vendia/serverless-express') as {
  default?: ServerlessExpressFactory;
} | ServerlessExpressFactory;
const serverlessExpress: ServerlessExpressFactory =
  typeof serverlessExpressModule === 'function'
    ? serverlessExpressModule
    : serverlessExpressModule.default as ServerlessExpressFactory;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

function decodeChunkedBody(body: string): string {
  if (!/^\s*[0-9a-f]+(?:;[^\r\n]*)?\r\n/i.test(body)) return body;

  let offset = 0;
  let decoded = '';
  while (offset < body.length) {
    const lineEnd = body.indexOf('\r\n', offset);
    if (lineEnd < 0) return body;
    const sizeLine = body.slice(offset, lineEnd).split(';', 1)[0].trim();
    const chunkSize = Number.parseInt(sizeLine, 16);
    if (Number.isNaN(chunkSize)) return body;
    offset = lineEnd + 2;
    if (chunkSize === 0) return decoded;
    decoded += body.slice(offset, offset + chunkSize);
    offset += chunkSize;
    if (body.slice(offset, offset + 2) !== '\r\n') return body;
    offset += 2;
  }
  return decoded;
}

function normalizeJsonBody(body: unknown): string {
  const rawBody = typeof body === 'string' ? body.trim() : JSON.stringify(body ?? {});
  const decodedBody = decodeChunkedBody(rawBody).trim();
  try {
    return JSON.stringify(JSON.parse(decodedBody));
  } catch (error) {
    const executionError = error instanceof Error ? error : new Error(String(error));
    console.error('INVALID JSON RESPONSE:', executionError.message);
    return JSON.stringify({ error: 'La Lambda generó una respuesta JSON inválida' });
  }
}

function withCorsHeaders(response: APIGatewayProxyResult): APIGatewayProxyResult {
  return {
    ...response,
    headers: {
      ...(response.headers ?? {}),
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    isBase64Encoded: false,
    body: normalizeJsonBody(response.body),
  };
}

const server = new Server({ port: 0 });
registerEndorsementRoutes(server, new DynamoMappingRepository());

let expressHandler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> | undefined;
const initializeHandler = async () => {
  await server.initialize();
  const hapiRequestListener = async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const requestUrl = request.url ?? '/';
      const hapiUrl = requestUrl.startsWith('/v1/') ? requestUrl : `/v1${requestUrl}`;
      const result = await server.inject({
        method: request.method ?? 'GET',
        url: hapiUrl,
        headers: request.headers,
        payload: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
      });
      response.statusCode = result.statusCode;
      for (const [name, value] of Object.entries(result.headers)) {
        if (value !== undefined) response.setHeader(name, value);
      }
      for (const [name, value] of Object.entries(corsHeaders)) {
        response.setHeader(name, value);
      }
      response.end(normalizeJsonBody(result.result));
    } catch (error) {
      const executionError = error instanceof Error ? error : new Error(String(error));
      console.error('EXECUTION ERROR:', executionError.message, executionError.stack);
      response.statusCode = 400;
      response.setHeader('content-type', 'application/json');
      for (const [name, value] of Object.entries(corsHeaders)) {
        response.setHeader(name, value);
      }
      response.end(JSON.stringify({ message: 'Error al procesar el endoso o registro no encontrado' }));
    }
  };
  return serverlessExpress<APIGatewayProxyEvent, APIGatewayProxyResult>({
    app: hapiRequestListener,
  });
};

export const handler: APIGatewayProxyHandler = async (event, context: Context) => {
  console.log('INCOMING EVENT:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    const response: APIGatewayProxyResult = {
      statusCode: 200,
      headers: corsHeaders,
      isBase64Encoded: false,
      body: normalizeJsonBody({ message: 'CORS Preflight OK' }),
    };
    console.log('OUTGOING RESPONSE:', JSON.stringify(response, null, 2));
    return response;
  }

  try {
    const activeHandler = expressHandler ?? await initializeHandler();
    expressHandler = activeHandler;
    const response = (await activeHandler(event, context, () => undefined)) as APIGatewayProxyResult;
    const outgoingResponse = withCorsHeaders(response);
    console.log('OUTGOING RESPONSE:', JSON.stringify(outgoingResponse, null, 2));
    return outgoingResponse;
  } catch (error) {
    const executionError = error instanceof Error ? error : new Error(String(error));
    console.error('EXECUTION ERROR:', executionError.message, executionError.stack);
    const response: APIGatewayProxyResult = {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      isBase64Encoded: false,
      body: normalizeJsonBody({ error: executionError.message }),
    };
    console.log('OUTGOING RESPONSE:', JSON.stringify(response, null, 2));
    return response;
  }
};
