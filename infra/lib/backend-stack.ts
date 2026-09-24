import * as cdk from 'aws-cdk-lib';
import { aws_apigateway as apigateway, aws_cognito as cognito, aws_lambda_nodejs as lambdaNode, aws_logs as logs, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface BackendStackProps extends cdk.StackProps { table: dynamodb.Table; userPool: cognito.UserPool }

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);
    const fn = new lambdaNode.NodejsFunction(this, 'EndorsementHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'backend/src/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: { minify: true, sourceMap: true, target: 'node24' },
    });
    props.table.grantReadData(fn);
    const api = new apigateway.RestApi(this, 'EndorsementApi', {
      restApiName: 'EndorsementApi',
      deployOptions: {
        stageName: 'v1',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST'],
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'EndorsementAuthorizer', { cognitoUserPools: [props.userPool] });
    api.root.addResource('endorse').addResource('translate').addMethod('POST', new apigateway.LambdaIntegration(fn), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer,
    });
    for (const [id, type] of [['Default4xx', apigateway.ResponseType.DEFAULT_4XX], ['Default5xx', apigateway.ResponseType.DEFAULT_5XX]] as const) {
      new apigateway.GatewayResponse(this, id, {
        restApi: api,
        type,
        responseHeaders: {
          'Access-Control-Allow-Origin': "'*'",
          'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'Access-Control-Allow-Methods': "'OPTIONS,POST'",
        },
      });
    }
    this.apiUrl = api.url.replace(/\/$/, '');
    new cdk.CfnOutput(this, 'ApiUrl', { value: this.apiUrl });
  }
}
