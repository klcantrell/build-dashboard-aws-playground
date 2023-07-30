"use client";

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USERPOOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

const poolData = {
  UserPoolId: `${userPoolId}`,
  ClientId: `${clientId}`,
};

const userPool = new CognitoUserPool(poolData);

function getCognitoUser(username: string) {
  const userData = {
    Username: username,
    Pool: userPool,
  };
  const cognitoUser = new CognitoUser(userData);

  return cognitoUser;
}

export async function signIn(
  username: string,
  password: string
): Promise<CognitoUserSession> {
  return new Promise<CognitoUserSession>(function (resolve, reject) {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const currentUser = getCognitoUser(username);

    currentUser.authenticateUser(authenticationDetails, {
      onSuccess(res: CognitoUserSession) {
        resolve(res);
      },
      onFailure(error: unknown) {
        reject(error);
      },
    });
  }).catch((err) => {
    throw err;
  });
}

interface Props {
  onLoading: () => void;
  onSuccess: (token: string) => void;
  onError: () => void;
}

export default function Login({ onLoading, onSuccess, onError }: Props) {
  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-center">Login</h2>
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();

          onLoading();

          const formData = new FormData(e.currentTarget);
          try {
            const result = await signIn(
              formData.get("username")!.toString(),
              formData.get("password")!.toString()
            );
            onSuccess(result.getAccessToken().getJwtToken());
          } catch {
            onError();
          }
        }}
      >
        <label className="flex w-[300px] justify-between">
          <span>Username</span>{" "}
          <input
            className="text-gray-800"
            type="text"
            name="username"
            autoComplete="off"
            data-lpignore="true"
            required
          />
        </label>
        <label className="flex w-[300px] justify-between">
          <span>Password:</span>{" "}
          <input
            className="text-gray-800"
            type="password"
            name="password"
            autoComplete="off"
            data-lpignore="true"
            required
          />
        </label>
        <button className="border-gray-300 bg-gray-100 font-bold py-1 mt-3 text-gray-800">
          Login
        </button>
      </form>
    </>
  );
}
