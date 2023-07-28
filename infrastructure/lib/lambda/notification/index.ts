import {
  Handler,
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
} from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { BuildStatusMessage } from "../../models";

const snsClient = new SNSClient({ region: "us-east-2" });
const dynamodbClient = new DynamoDBClient({ region: "us-east-2" });

const handler: Handler<SQSEvent, SQSBatchResponse> = async (event) => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  const messages: (BuildStatusMessage | string)[] = event.Records.map(
    (record) => {
      try {
        const parsedMessage = JSON.parse(record.body);
        if (isBuildStatusMessage(parsedMessage)) {
          return { ...parsedMessage, id: record.messageId };
        } else {
          return record.messageId;
        }
      } catch {
        return record.messageId;
      }
    }
  );

  for (const message of messages) {
    if (typeof message === "string") {
      console.log("received an unrecognized message format", message);
    } else {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          dateStyle: "long",
          timeStyle: "long",
        });
        const publishCommand = new PublishCommand({
          Subject: "Build Status",
          Message: `${message.status.toUpperCase()} at ${formatter.format(
            new Date(message.timestamp)
          )}. Check the dashboard at ${process.env.CLOUDFRONT_URL}`,
          TopicArn: process.env.SNS_TOPIC_ARN,
        });
        const snsResult = await snsClient.send(publishCommand);
        console.log(
          `processed SQS message ${snsResult.MessageId}`,
          JSON.stringify(message, null, 2)
        );
      } catch {
        console.log(`failed to process SQS message ${message.id}`);
        batchItemFailures.push({ itemIdentifier: message.id });
      }

      try {
        const putItemCommand = new PutItemCommand({
          TableName: process.env.BUILD_STATUS_TABLE_NAME,
          Item: {
            id: {
              S: message.id,
            },
            type: {
              S: 'build-status',
            },
            timestamp: {
              N: message.timestamp.toString(),
            },
            status: {
              S: message.status,
            },
          },
          ReturnConsumedCapacity: "TOTAL",
        });
        const dynamodbResult = await dynamodbClient.send(putItemCommand);
        console.log(
          `saved to dynamodb ${dynamodbResult.ConsumedCapacity?.CapacityUnits}`
        );
      } catch {
        console.log(`failed to save to dynamodb ${message.id}`);
        batchItemFailures.push({ itemIdentifier: message.id });
      }
    }
  }

  return { batchItemFailures };
};

function isBuildStatusMessage(
  parsedMessage: unknown
): parsedMessage is BuildStatusMessage {
  const parsedMessageAsType = parsedMessage as BuildStatusMessage;
  if (!parsedMessageAsType) {
    return false;
  }

  if (
    parsedMessageAsType.status !== "pass" &&
    parsedMessageAsType.status !== "fail"
  ) {
    return false;
  }

  if (typeof parsedMessageAsType.timestamp !== "number") {
    return false;
  }

  return true;
}

exports.handler = handler;
