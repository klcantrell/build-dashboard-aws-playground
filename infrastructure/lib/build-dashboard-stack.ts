import path from "path";

import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class BuildDashboardStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, "FrontendBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const distribution = new cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin: new cloudfrontOrigins.S3Origin(hostingBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new s3Deployment.BucketDeployment(this, "BucketDeployment", {
      sources: [
        s3Deployment.Source.asset(
          path.join(__dirname, "../../frontend", "out")
        ),
      ],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
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
      selfSignUpEnabled: false,
    });

    const client = userPool.addClient("AppClient");

    const queue = new sqs.Queue(this, "BuildStatusQueue", {
      queueName: "BuildStatusQueue",
      visibilityTimeout: Duration.seconds(60),
    });

    const notificationLambda = new lambda.Function(this, "BuildNotificationFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../lambda", "notification")
      ),
    });

    notificationLambda.addEventSource(
      new SqsEventSource(queue, { batchSize: 10 })
    );

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

    new CfnOutput(this, "BuildNotificationFunctionArn", {
      value: notificationLambda.functionArn,
      description: "The arn of the notification Lambda function",
      exportName: "BuildNotificationFunctionArn",
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "The user pool ID",
      exportName: "UserPoolId",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: client.userPoolClientId,
      description: "The user pool client ID",
      exportName: "UserPoolClientId",
    });

    new CfnOutput(this, "BuildStatusQueueUrl", {
      value: queue.queueUrl,
      description: "The queue URL",
      exportName: "BuildStatusQueueUrl",
    });
  }
}