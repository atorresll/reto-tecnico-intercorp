import 'dotenv/config';
import cors = require('cors');
import { config } from 'dotenv';
import express = require('express');
import type { NextFunction, Request, Response } from 'express';
import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as path from 'node:path';

config({ path: path.resolve(__dirname, '../.env') });
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({
  origin: '*',
  methods: ['OPTIONS', 'POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log('LOCAL INCOMING REQUEST:', JSON.stringify({
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
  }, null, 2));
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

async function invokeLambda(
  lambdaHandler: APIGatewayProxyHandler,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const event: APIGatewayProxyEvent = {
      body: req.body ? JSON.stringify(req.body) : null,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : value ?? '',
        ]),
      ),
      multiValueHeaders: {},
      httpMethod: req.method,
      isBase64Encoded: false,
      path: req.path,
      pathParameters: null,
      queryStringParameters: Object.keys(req.query).length > 0
        ? Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, String(value)]))
        : null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as APIGatewayProxyEvent['requestContext'],
      resource: req.path,
    };
    const result = await lambdaHandler(event, {} as Context, () => undefined) as APIGatewayProxyResult;
    console.log('LOCAL OUTGOING RESPONSE:', JSON.stringify(result, null, 2));
    res.status(result.statusCode).type('application/json').send(result.body);
  } catch (error) {
    next(error);
  }
}

async function start(): Promise<void> {
  const { handler } = require('./index') as { handler: APIGatewayProxyHandler };
  app.post(['/endorse/translate', '/v1/endorse/translate'], (req, res, next) => (
    invokeLambda(handler, req, res, next)
  ));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Error local no controlado';
    console.error('LOCAL EXECUTION ERROR:', message, error instanceof Error ? error.stack : undefined);
    res.status(500).json({ error: message });
  });
  app.listen(port, () => {
    console.log(`Local endorsement backend listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('LOCAL STARTUP ERROR:', message);
  process.exitCode = 1;
});
