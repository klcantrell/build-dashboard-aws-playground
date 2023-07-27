import { APIGatewayEvent, APIGatewayProxyResult, Handler } from "aws-lambda";

const handler: Handler<APIGatewayEvent, APIGatewayProxyResult> = async (
  event
) => {
  return {
    statusCode: 200,
    body: "Hi",
  };
};

exports.handler = handler;
