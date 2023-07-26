import path from "path";

import {
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_cognito,
} from "aws-cdk-lib";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new Bucket(this, "FrontendBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const distribution = new Distribution(this, "CloudFrontDistribution", {
      defaultBehavior: {
        origin: new S3Origin(hostingBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    new BucketDeployment(this, "BucketDeployment", {
      sources: [Source.asset(path.join(__dirname, "../../frontend", "out"))],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    const userPool = new aws_cognito.UserPool(this, "UserPool", {
      signInAliases: {
        email: true,
        username: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      selfSignUpEnabled: true,
    });

    const client = userPool.addClient("AppClient");

    new CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "The distribution URL",
      exportName: "CloudfrontURL",
    });

    new CfnOutput(this, "BucketName", {
      value: hostingBucket.bucketName,
      description: "The name of the S3 bucket",
      exportName: "BucketName",
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: client.userPoolClientId,
    });
  }
}
