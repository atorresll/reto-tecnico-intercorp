#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
const database = new DatabaseStack(app, 'EndorsementDatabaseStack', { env });
const auth = new AuthStack(app, 'EndorsementAuthStack', { env });
const backend = new BackendStack(app, 'EndorsementBackendStack', { env, table: database.table, userPool: auth.userPool });
new FrontendStack(app, 'EndorsementFrontendStack', { env, apiUrl: backend.apiUrl });
