import * as cdk from 'aws-cdk-lib';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.userPool = new cognito.UserPool(this, 'EndorsementUserPool', {
      userPoolName: 'EndorsementUserPool',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      passwordPolicy: { minLength: 12, requireLowercase: true, requireUppercase: true, requireDigits: true, requireSymbols: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const client = this.userPool.addClient('EndorsementUserPoolClient', {
      userPoolClientName: 'EndorsementWebClient',
      generateSecret: false,
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
    });
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });
  }
}
