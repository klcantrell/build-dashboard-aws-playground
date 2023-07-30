import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { BuildStatusStatistics } from "../../common";

const dynamodbClient = new DynamoDBClient({ region: "us-east-2" });

const handler: Handler<APIGatewayEvent, APIGatewayProxyResult> = async (
  event
) => {
  try {
    const scanCommand: ScanCommand = new ScanCommand({
      TableName: process.env.BUILD_STATUS_STATISTICS_TABLE_NAME,
      ProjectionExpression: "#S, #C",
      ExpressionAttributeNames: {
        "#S": "status",
        "#C": "count",
      },
    });

    const results = await dynamodbClient.send(scanCommand);
    const initialValue: BuildStatusStatistics = { pass: 0, fail: 0 };
    const payload: BuildStatusStatistics =
      results.Items?.reduce((statistics, item) => {
        if (!item) {
          return statistics;
        }
        const status = item.status;
        const count = item.count;

        if (status == null || count == null) {
          return statistics;
        }

        if (status.S == null || count.N == null) {
          return statistics;
        }

        if (status.S !== "pass" && status.S !== "fail") {
          return statistics;
        }

        return {
          ...statistics,
          [status.S]: Number(count.N),
        };
      }, initialValue) ?? initialValue;

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

exports.handler = handler;
