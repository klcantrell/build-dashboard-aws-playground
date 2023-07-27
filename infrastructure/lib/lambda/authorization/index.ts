import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
  Handler,
  PolicyDocument,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USERPOOL_ID ?? "",
  clientId: process.env.COGNITO_CLIENT_ID,
  tokenUse: "access",
});

const handler: Handler<
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult
> = async (event) => {
  if (event.headers?.["Authorization"] == null) {
    throw new Error("Unauthorized");
  }

  const authToken = event.headers["Authorization"];

  try {
    console.log('decoding', authToken);
    // @ts-ignore - the 2nd argument is actually optional since we already configured the verify above
    const decodedJWT = await cognitoVerifier.verify(authToken);

    const policyDocument: PolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: event["methodArn"],
        },
      ],
    };

    return {
      policyDocument,
      principalId: decodedJWT.sub,
    };
  } catch (err) {
    console.error("Invalid auth token error => ", err);
    throw new Error("Unauthorized");
  }
};

exports.handler = handler;
