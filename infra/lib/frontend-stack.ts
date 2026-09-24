import * as cdk from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront, aws_cloudfront_origins as origins, aws_s3 as s3, aws_s3_deployment as deployment } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface FrontendStackProps extends cdk.StackProps { apiUrl: string }

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: { origin: origins.S3BucketOrigin.withOriginAccessControl(bucket), viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS },
      errorResponses: [{ httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' }, { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }],
    });
    new deployment.BucketDeployment(this, 'FrontendDeployment', {
      destinationBucket: bucket,
      sources: [deployment.Source.asset('frontend/dist')],
      distribution,
      distributionPaths: ['/*'],
      memoryLimit: 512,
    });
    new cdk.CfnOutput(this, 'CloudFrontUrl', { value: `https://${distribution.domainName}` });
    new cdk.CfnOutput(this, 'ApiUrl', { value: props.apiUrl });
  }
}
