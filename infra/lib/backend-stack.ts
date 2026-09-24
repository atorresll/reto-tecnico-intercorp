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
      environment: { TABLE_NAME: props.table.tableName },
      bundling: { minify: true, sourceMap: true, target: 'node24' },
    });
    props.table.grantWriteData(fn);
    const api = new apigateway.RestApi(this, 'EndorsementApi', {
      restApiName: 'EndorsementApi',
      deployOptions: { stageName: 'v1', tracingEnabled: true, loggingLevel: apigateway.MethodLoggingLevel.ERROR },
      defaultCorsPreflightOptions: { allowOrigins: apigateway.Cors.ALL_ORIGINS, allowMethods: ['POST'], allowHeaders: ['Authorization', 'Content-Type'] },
    });
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'EndorsementAuthorizer', { cognitoUserPools: [props.userPool] });
    api.root.addResource('endorse').addResource('translate').addMethod('POST', new apigateway.LambdaIntegration(fn), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer,
    });
    this.apiUrl = api.url.replace(/\/$/, '');
    new cdk.CfnOutput(this, 'ApiUrl', { value: this.apiUrl });
  }
}
