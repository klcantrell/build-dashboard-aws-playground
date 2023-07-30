import { AttributeValue } from "aws-lambda";
import { AttributeValue as AttributeValueClass } from "@aws-sdk/client-dynamodb"

type EpochMilliseconds = number;

export type BuildStatusMessage = {
  type: 'build-status';
  id: string;
  status: "pass" | "fail";
  timestamp: EpochMilliseconds;
};

export type BuildStatusStatistics = {
  pass: number;
  fail: number;
};

export function parseBuildStatusMessageFromSqs(body: string): BuildStatusMessage | undefined {
  const parsed = JSON.parse(body);
  if (isSqsBuildStatusMessage(parsed)) {
    return parsed;
  } else {
    return undefined;
  }
}

export function parseBuildStatusMessageFromDynamoDb(record: Record<string, AttributeValue | AttributeValueClass>): BuildStatusMessage | undefined {
  if (!record) {
    return undefined;
  }

  const id = record.id;
  const status = record.status;
  const timestamp = record.timestamp;
  const type = record.type;

  if (id == null || status == null || timestamp == null || type == null) {
    return undefined;
  }

  if (
    id.S == null ||
    status.S == null ||
    timestamp.N == null ||
    type.S == null
  ) {
    return undefined;
  }

  if (type.S !== "build-status") {
    return undefined;
  }

  if (status.S !== "pass" && status.S !== "fail") {
    return undefined;
  }

  return {
    id: id.S,
    status: status.S,
    timestamp: Number(timestamp.N),
    type: type.S,
  };
}

function isSqsBuildStatusMessage(
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
