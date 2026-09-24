import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import type { EndorsementRequest } from './entity/endorsement.entity';
import { MappingNotFoundError } from './repository/mapping.repository';
import { DynamoMappingRepository } from './repository/mapping.repository';
import {
  EndorsementService,
  InvalidMappingTemplateError,
  MissingTemplateFieldsError,
} from './service/endorsement.service';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

const translationService = new EndorsementService(new DynamoMappingRepository());

function response(
  statusCode: number,
  payload: unknown,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    isBase64Encoded: false,
    body: JSON.stringify(payload),
  };
}

function parseRequestBody(event: APIGatewayProxyEvent): EndorsementRequest {
  if (!event.body) {
    throw new Error('El cuerpo de la petición es obligatorio');
  }
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  const parsedBody: unknown = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('El cuerpo de la petición debe ser un objeto JSON');
  }
  return parsedBody as EndorsementRequest;
}

function getErrorResponse(error: unknown): APIGatewayProxyResult {
  if (error instanceof MappingNotFoundError) {
    return response(404, { error: error.message });
  }
  if (error instanceof InvalidMappingTemplateError) {
    return response(422, { error: 'PlantillaInvalida', message: error.message });
  }
  if (error instanceof MissingTemplateFieldsError) {
    return response(400, { error: 'CamposRequeridosFaltantes', message: error.message });
  }
  const message = error instanceof Error ? error.message : 'Error interno de traducción';
  return response(400, { error: message });
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('INCOMING EVENT:', JSON.stringify(event, null, 2));
  if (event.httpMethod === 'OPTIONS') {
    const preflightResponse = response(200, { message: 'CORS Preflight OK' });
    console.log('OUTGOING RESPONSE:', JSON.stringify(preflightResponse, null, 2));
    return preflightResponse;
  }

  try {
    const input = parseRequestBody(event);
    const result = await translationService.translate(input);
    const successResponse = response(200, result);
    console.log('OUTGOING RESPONSE:', JSON.stringify(successResponse, null, 2));
    return successResponse;
  } catch (error) {
    const executionError = error instanceof Error ? error : new Error(String(error));
    console.error('EXECUTION ERROR:', executionError.message, executionError.stack);
    const errorResponse = getErrorResponse(error);
    console.log('OUTGOING RESPONSE:', JSON.stringify(errorResponse, null, 2));
    return errorResponse;
  }
};
