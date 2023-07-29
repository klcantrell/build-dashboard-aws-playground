import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { BuildStatusStatistic } from "../../common";

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
    const payload: BuildStatusStatistic[] =
      results.Items?.flatMap((item) => {
        if (!item) {
          return [];
        }
        const status = item.status;
        const count = item.count;

        if (status == null || count == null) {
          return [];
        }

        if (status.S == null || count.N == null) {
          return [];
        }

        if (status.S !== "pass" && status.S !== "fail") {
          return [];
        }

        return {
          status: status.S,
          count: Number(count.N),
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
