import { DynamoDBStreamEvent, Handler } from "aws-lambda";

const handler: Handler<DynamoDBStreamEvent> = async (event) => {
  console.log('sync build status lambda started');
  for (const record of event.Records) {
    console.log('Event ID', record.eventID);
    console.log('Event name', record.eventName);
    console.log('DynamoDB record', JSON.stringify(record.dynamodb));
  }
  console.log('sync build status lambda ended');
};

exports.handler = handler;
