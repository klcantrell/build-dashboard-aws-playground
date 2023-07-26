import { Handler, SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from "aws-lambda";

type EpochMilliseconds = number;

type BuildStatusMessage = {
  status: 'pass' | 'fail';
  timestamp: EpochMilliseconds;
};

const handler: Handler<SQSEvent, SQSBatchResponse> = async (event) => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  const messages: (BuildStatusMessage | string)[] = event.Records.map((record) => {
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
  });

  for (const message of messages) {
    if (message) {
      console.log('processed SQS message', JSON.stringify(message, null, 2));
    } else {
      console.log('received an unrecognized message format', message);
    }
  }

  return { batchItemFailures };
};

function isBuildStatusMessage(parsedMessage: unknown): parsedMessage is BuildStatusMessage {
  const parsedMessageAsType = parsedMessage as BuildStatusMessage;
  if (!parsedMessageAsType) {
    return false;
  }

  if (parsedMessageAsType.status !== 'pass' && parsedMessageAsType.status !== 'fail') {
    return false;
  }

  if (typeof parsedMessageAsType.timestamp !== 'number') {
    return false;
  }

  return true;
}

exports.handler = handler;
