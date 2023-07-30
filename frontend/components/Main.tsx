"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Login from "@/components/Login";
import { fetchBuildHistory, fetchBuildStatusStatistics } from "@/api";

export default function Main() {
  const [userState, setUserState] = useState<
    | { type: "initial" }
    | { type: "signing-in" }
    | { type: "signed-in"; token: string }
    | { type: "error" }
  >({ type: "initial" });

  const buildHistoryQuery = useQuery({
    queryKey: ["build-history"],
    queryFn: () =>
      fetchBuildHistory(userState.type === "signed-in" ? userState.token : ""),
    enabled: userState.type === "signed-in",
  });

  const buildStatusStatisticsQuery = useQuery({
    queryKey: ["build-status-statistics"],
    queryFn: () =>
      fetchBuildStatusStatistics(
        userState.type === "signed-in" ? userState.token : ""
      ),
    enabled: userState.type === "signed-in",
  });

  const loading =
    buildHistoryQuery.isInitialLoading ||
    buildStatusStatisticsQuery.isInitialLoading ||
    userState.type === "signing-in";

  return (
    <main className="flex min-h-screen flex-col items-center mt-12">
      <h1 className="text-xl font-semibold">Build dashboard</h1>
      <section className="mt-8">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {(userState.type === "initial" || userState.type === "error") && (
              <Login
                onLoading={() => {
                  setUserState({ type: "signing-in" });
                }}
                onSuccess={(token) => {
                  setUserState({ type: "signed-in", token: token });
                }}
                onError={() => {
                  setUserState({ type: "error" });
                }}
              />
            )}

            {userState.type === "signed-in" && (
              <>
                <h2 className="text-lg font-semibold mb-4 text-center">
                  Build history (last 10)
                </h2>
                {buildHistoryQuery.data &&
                  (buildHistoryQuery.data.length > 0 ? (
                    <table className="mb-14">
                      <thead>
                        <tr>
                          <th className="text-left">Status</th>
                          <th className="text-left">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildHistoryQuery.data.map((build) => {
                          return (
                            <tr key={build.id} className="w-full">
                              <td className="text-left min-w-[100px]">
                                {build.status}
                              </td>
                              <td className="text-left">
                                {new Intl.DateTimeFormat(navigator.language, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }).format(new Date(build.timestamp))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="mb-14">No builds found</p>
                  ))}

                {buildStatusStatisticsQuery.data && (
                  <>
                    <h2 className="text-lg font-semibold mb-4 text-center">
                      Build status statistics
                    </h2>
                    <table>
                      <thead>
                        <tr>
                          <th className="text-left min-w-[100px]">Passes</th>
                          <td className="text-left">
                            {buildStatusStatisticsQuery.data.pass}
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="w-full">
                          <th className="text-left min-w-[100px]">Fails</th>
                          <td className="text-left">
                            {buildStatusStatisticsQuery.data.fail}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
