"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
// run export AWS_PROFILE=default-profile for this to work locally
const QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/108929348570/BuildStatusQueue';
const client = new client_sqs_1.SQSClient({ region: 'us-east-2' });
const messageCommand = new client_sqs_1.SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ status: process.argv[2], timestamp: Date.now() }),
});
async function sendMessage() {
    const response = await client.send(messageCommand);
    console.log(JSON.stringify(response, null, 2));
}
sendMessage();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZE1lc3NhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZW5kTWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9EQUFvRTtBQUVwRSxrRUFBa0U7QUFFbEUsTUFBTSxTQUFTLEdBQUcsbUVBQW1FLENBQUM7QUFFdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFFdEQsTUFBTSxjQUFjLEdBQUcsSUFBSSwrQkFBa0IsQ0FBQztJQUM1QyxRQUFRLEVBQUUsU0FBUztJQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztDQUNoRixDQUFDLENBQUM7QUFFSCxLQUFLLFVBQVUsV0FBVztJQUN4QixNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRUQsV0FBVyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTUVNDbGllbnQsIFNlbmRNZXNzYWdlQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zcXMnO1xuXG4vLyBydW4gZXhwb3J0IEFXU19QUk9GSUxFPWRlZmF1bHQtcHJvZmlsZSBmb3IgdGhpcyB0byB3b3JrIGxvY2FsbHlcblxuY29uc3QgUVVFVUVfVVJMID0gJ2h0dHBzOi8vc3FzLnVzLWVhc3QtMi5hbWF6b25hd3MuY29tLzEwODkyOTM0ODU3MC9CdWlsZFN0YXR1c1F1ZXVlJztcblxuY29uc3QgY2xpZW50ID0gbmV3IFNRU0NsaWVudCh7IHJlZ2lvbjogJ3VzLWVhc3QtMicgfSk7XG5cbmNvbnN0IG1lc3NhZ2VDb21tYW5kID0gbmV3IFNlbmRNZXNzYWdlQ29tbWFuZCh7XG4gIFF1ZXVlVXJsOiBRVUVVRV9VUkwsXG4gIE1lc3NhZ2VCb2R5OiBKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogcHJvY2Vzcy5hcmd2WzJdLCB0aW1lc3RhbXA6IERhdGUubm93KCkgfSksXG59KTtcblxuYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQobWVzc2FnZUNvbW1hbmQpO1xuXG4gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLCBudWxsLCAyKSk7XG59XG5cbnNlbmRNZXNzYWdlKCk7XG4iXX0=