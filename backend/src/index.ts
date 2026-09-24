import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import type { IncomingMessage, ServerResponse } from 'node:http';
import Hapi from '@hapi/hapi';
import serverlessExpress from '@vendia/serverless-express';
import { registerEndorsementRoutes } from './routes/endorsement.routes';
import { DynamoMappingRepository } from './repository/mapping.repository';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

const server = Hapi.server({ port: 0 });
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
      response.end(typeof result.result === 'string' ? result.result : JSON.stringify(result.result ?? {}));
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
  try {
    expressHandler ??= await initializeHandler();
    const response = (await expressHandler(event, context, () => undefined)) as APIGatewayProxyResult;
    const outgoingResponse: APIGatewayProxyResult = {
      ...response,
      headers: { ...corsHeaders, ...(response.headers ?? {}) },
    };
    console.log('OUTGOING RESPONSE:', JSON.stringify(outgoingResponse, null, 2));
    return outgoingResponse;
  } catch (error) {
    const executionError = error instanceof Error ? error : new Error(String(error));
    console.error('EXECUTION ERROR:', executionError.message, executionError.stack);
    const response: APIGatewayProxyResult = {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Error al procesar el endoso o registro no encontrado',
      }),
    };
    console.log('OUTGOING RESPONSE:', JSON.stringify(response, null, 2));
    return response;
  }
};
