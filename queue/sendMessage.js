import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// run export AWS_PROFILE=default-profile for this to work locally

const QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/108929348570/BuildStatusQueue';

const client = new SQSClient({ region: 'us-east-2' });

const messageCommand = new SendMessageCommand({
  QueueUrl: QUEUE_URL,
  MessageBody: JSON.stringify({ status: process.argv[2], timestamp: Date.now() }),
});

const response = await client.send(messageCommand);

console.log(JSON.stringify(response, null, 2));
