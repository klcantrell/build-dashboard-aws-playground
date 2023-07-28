import { DynamoDBStreamEvent, Handler } from "aws-lambda";
import { parseBuildStatusMessageFromDynamoDb } from "../../common";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodbClient = new DynamoDBClient({ region: "us-east-2" });

const handler: Handler<DynamoDBStreamEvent> = async (event) => {
  for (const record of event.Records) {
    const dynamoDbRecord = record.dynamodb?.NewImage;
    if (dynamoDbRecord) {
      const parsed = parseBuildStatusMessageFromDynamoDb(dynamoDbRecord);
      if (parsed) {
        try {
          const updateItemCommand = new UpdateItemCommand({
            TableName: process.env.BUILD_STATUS_STATISTICS_TABLE_NAME,
            Key: {
              status: {
                S: parsed.status,
              },
            },
            UpdateExpression: "ADD #C :value",
            ExpressionAttributeNames: {
              "#C": "count",
            },
            ExpressionAttributeValues: {
              ":value": {
                N: "1",
              },
            },
          });
          await dynamodbClient.send(updateItemCommand);
          console.log(
            `saved statistics to DynamoDB for ${JSON.stringify(parsed)}`
          );
        } catch (error) {
          console.log(
            "failed to process DynamoDB record",
            JSON.stringify(dynamoDbRecord)
          );
          console.error(error);
        }
      } else {
        console.log(
          "unrecognized DynamoDB record",
          JSON.stringify(dynamoDbRecord)
        );
      }
    }
  }
};

exports.handler = handler;
