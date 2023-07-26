"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  IAuthenticationCallback,
} from "amazon-cognito-identity-js";
import { useState } from "react";

export default function Main() {
  const [accessToken, setAccessToken] = useState<
    | { type: "initial" }
    | { type: "loading" }
    | { type: "success"; value: string }
    | { type: "error" }
  >({ type: "initial" });

  const data = useQuery({
    queryKey: ["bananaPhone"],
    queryFn: fetchBananaPhone,
  });

  const loading =
    data.isLoading || data.data == null || accessToken.type === "loading";

  return (
    <main className="flex min-h-screen flex-col items-center mt-12">
      <h1 className="text-xl font-semibold">Build dashboard</h1>
      <section className="mt-8">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {(accessToken.type === "initial" ||
              accessToken.type === "error") && (
              <>
                <h2 className="text-lg font-semibold mb-2">Login</h2>
                <form
                  className="flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();

                    setAccessToken({ type: "loading" });

                    const formData = new FormData(e.currentTarget);
                    try {
                      const result = await signIn(
                        formData.get("username")!.toString(),
                        formData.get("password")!.toString()
                      );
                      setAccessToken({
                        type: "success",
                        value: result.getAccessToken().getJwtToken(),
                      });
                    } catch {
                      setAccessToken({ type: "error" });
                    }
                  }}
                >
                  <label className="flex w-[300px] justify-between">
                    <span className="text-">Username</span>{" "}
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
                  <button className="border-gray-300 bg-gray-100 font-bold py-1 mt-2 text-gray-800">
                    Login
                  </button>
                </form>
              </>
            )}

            {accessToken.type === "success" && (
              <>
                <h2 className="text-lg font-semibold">Data</h2>
                <p>{data.data}</p>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

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

function fetchBananaPhone(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("banana phone!");
    }, 2000);
  });
}
