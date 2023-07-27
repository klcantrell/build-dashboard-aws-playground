import {
  Handler,
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
} from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-2" });

type EpochMilliseconds = number;

type BuildStatusMessage = {
  status: "pass" | "fail";
  timestamp: EpochMilliseconds;
};

const handler: Handler<SQSEvent, SQSBatchResponse> = async (event) => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  const messages: (BuildStatusMessage | string)[] = event.Records.map(
    (record) => {
      try {
        const parsedMessage = JSON.parse(record.body);
        if (isBuildStatusMessage(parsedMessage)) {
          return parsedMessage;
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
      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "long",
      });
      const publishCommand = new PublishCommand({
        Subject: "Build Status",
        Message: `${message.status.toUpperCase()} at ${formatter.format(
          new Date(message.timestamp)
        )}`,
        TopicArn: process.env.SNS_TOPIC_ARN,
      });
      const result = await snsClient.send(publishCommand);
      console.log(
        `processed SQS message ${result.MessageId}`,
        JSON.stringify(message, null, 2)
      );
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
