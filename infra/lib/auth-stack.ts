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
    this.userPool.addDomain('EndorsementHostedUiDomain', {
      cognitoDomain: {
        domainPrefix: 'endorsement-auth-intercorp',
      },
    });
    const client = this.userPool.addClient('EndorsementUserPoolClient', {
      userPoolClientName: 'EndorsementWebClient',
      generateSecret: false,
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:5173/',
          'https://d6hlj8pssoyj7.cloudfront.net/',
        ],
        logoutUrls: [
          'http://localhost:5173/',
          'https://d6hlj8pssoyj7.cloudfront.net/',
        ],
      },
    });
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });
    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `endorsement-auth-intercorp.auth.${this.region}.amazoncognito.com`,
    });
  }
}
