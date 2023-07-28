import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { BuildStatusMessage } from "../../models";

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
      results.Items?.flatMap((item) => {
        const id = item.id;
        const status = item.status;
        const timestamp = item.timestamp;
        const type = item.type;

        if (id == null || status == null || timestamp == null || type == null) {
          return [];
        }

        if (
          id.S == null ||
          status.S == null ||
          timestamp.N == null ||
          type.S == null
        ) {
          return [];
        }

        if (type.S !== 'build-status') {
          return [];
        }

        if (status.S !== 'pass' && status.S !== 'fail') {
          return []
        }

        return {
          id: id.S,
          status: status.S,
          timestamp: Number(timestamp.N),
          type: type.S,
        };
      }) ?? [];

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

exports.handler = handler;
