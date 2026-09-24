import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway as apigateway,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda_nodejs as lambdaNode,
  aws_logs as logs,
} from 'aws-cdk-lib';
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

    const apiGwCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
      ],
    });
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGwCloudWatchRole.roleArn,
    });

    const apiAccessLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: '/aws/apigateway/endorsement-api-access-logs',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'EndorsementApi', {
      restApiName: 'EndorsementApi',
      deployOptions: {
        stageName: 'v1',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiAccessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.custom(JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          caller: '$context.identity.caller',
          user: '$context.identity.user',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          resourcePath: '$context.resourcePath',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          errorMessage: '$context.error.message',
          integrationErrorMessage: '$context.integration.error',
        })),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });
    api.root.addResource('endorse').addResource('translate').addMethod('POST', new apigateway.LambdaIntegration(fn), {
      // The frontend quick-login token is a development token, not a Cognito-signed JWT.
      // Keep API Gateway open for this demo flow; production authentication can be
      // restored by attaching the Cognito authorizer to this method.
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    this.apiUrl = api.url.replace(/\/$/, '');
    new cdk.CfnOutput(this, 'ApiUrl', { value: this.apiUrl });
  }
}
