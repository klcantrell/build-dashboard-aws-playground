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
import * as sqsEventSource from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

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
    const distributionUrl = `https://${distribution.distributionDomainName}`;

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

    const cognitoClient = userPool.addClient("AppClient");

    const queue = new sqs.Queue(this, "BuildStatusQueue", {
      queueName: "BuildStatusQueue",
      visibilityTimeout: Duration.seconds(60),
    });
    const buildStatusTopic = new sns.Topic(this, "BuildStatusTopic", {
      displayName: "Build Status Notifications",
    });
    const buildStatusTable = new dynamodb.Table(this, "BuildStatusTable-rev2", {
      partitionKey: { name: "type", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const notificationLambda = new lambda.Function(
      this,
      "BuildNotificationFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda/notification")
        ),
        environment: {
          SNS_TOPIC_ARN: buildStatusTopic.topicArn,
          CLOUDFRONT_URL: distributionUrl,
          BUILD_STATUS_TABLE_NAME: buildStatusTable.tableName,
        },
      }
    );

    notificationLambda.addEventSource(
      new sqsEventSource.SqsEventSource(queue, { batchSize: 10 })
    );
    buildStatusTopic.grantPublish(notificationLambda);

    const authorizationLambda = new lambda.Function(
      this,
      "AuthorizationFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda/authorization")
        ),
        environment: {
          COGNITO_USERPOOL_ID: userPool.userPoolId,
          COGNITO_CLIENT_ID: cognitoClient.userPoolClientId,
        },
      }
    );
    const apiAuthorizer = new apiGateway.RequestAuthorizer(
      this,
      "BuildStatusApiAuthorizer",
      {
        handler: authorizationLambda,
        // required key event if we want to disable caching
        identitySources: [apiGateway.IdentitySource.header("Authorization")],
        // disable caching
        resultsCacheTtl: Duration.seconds(0),
      }
    );

    const getBuildStatusLambda = new lambda.Function(
      this,
      "GetBuildStatusFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda/getBuildStatus")
        ),
        environment: {
          BUILD_STATUS_TABLE_NAME: buildStatusTable.tableName,
        },
      }
    );
    const syncBuildStatusAggregationLambda = new lambda.Function(
      this,
      "SyncBuildStatusAggregationFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda/syncBuildStatusAggregation")
        ),
      }
    );
    syncBuildStatusAggregationLambda.addEventSource(
      new lambdaEventSources.DynamoEventSource(buildStatusTable, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    buildStatusTable.grantFullAccess(notificationLambda);
    buildStatusTable.grantReadData(getBuildStatusLambda);

    const api = new apiGateway.RestApi(this, "BuildStatusApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
      },
    });
    const buildStatusResource = api.root.addResource("build-status");
    buildStatusResource.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(getBuildStatusLambda),
      {
        authorizer: apiAuthorizer,
        authorizationType: apiGateway.AuthorizationType.CUSTOM,
      }
    );

    new CfnOutput(this, "CloudFrontURL", {
      value: distributionUrl,
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
      value: cognitoClient.userPoolClientId,
      description: "The user pool client ID",
      exportName: "UserPoolClientId",
    });

    new CfnOutput(this, "BuildStatusQueueUrl", {
      value: queue.queueUrl,
      description: "The queue URL",
      exportName: "BuildStatusQueueUrl",
    });

    new CfnOutput(this, "BuildStatusTopicArn", {
      value: buildStatusTopic.topicArn,
      description: "The arn of the notification topic",
      exportName: "BuildStatusTopicArn",
    });

    new CfnOutput(this, "BuildStatusTableName", {
      value: buildStatusTable.tableArn,
      description: "The build status table name",
      exportName: "BuildStatusTableName",
    });

    new CfnOutput(this, "BuildStatusApiUrl", {
      value: api.urlForPath("/build-status"),
      description: "The build status API URL",
      exportName: "BuildStatusApiUrl",
    });
  }
}
