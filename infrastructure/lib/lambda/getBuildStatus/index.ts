import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  BuildStatusMessage,
  parseBuildStatusMessageFromDynamoDb,
} from "../../common";

const dynamodbClient = new DynamoDBClient({ region: "us-east-2" });

const handler: Handler<APIGatewayEvent, APIGatewayProxyResult> = async (
  event
) => {
  try {
    const queryCommand: QueryCommand = new QueryCommand({
      TableName: process.env.BUILD_STATUS_TABLE_NAME,
      ProjectionExpression: "id, #T, #TS, #S",
      Limit: 10,
      ScanIndexForward: false,
      KeyConditionExpression: "#T = :type",
      ExpressionAttributeNames: {
        "#T": "type",
        "#TS": "timestamp",
        "#S": "status",
      },
      ExpressionAttributeValues: {
        ":type": {
          S: "build-status",
        },
      },
    });

    const results = await dynamodbClient.send(queryCommand);
    const payload: BuildStatusMessage[] =
      results.Items?.flatMap(
        (item) => parseBuildStatusMessageFromDynamoDb(item) ?? []
      ) ?? [];

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

exports.handler = handler;
