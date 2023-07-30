import { z } from "zod";

const BuildStatus = z.object({
  id: z.string(),
  status: z.union([z.literal("pass"), z.literal("fail")]),
  timestamp: z.number(),
});
const BuildStatuses = z.array(BuildStatus);

type BuildStatus = z.infer<typeof BuildStatus>;

export async function fetchBuildHistory(token: string): Promise<BuildStatus[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/build-status`,
    {
      method: "GET",
      headers: {
        Authorization: token,
      },
    }
  );
  const data = await response.json();
  if (response.ok) {
    const parsed = BuildStatuses.parse(data);
    if (parsed) {
      return parsed;
    } else {
      throw Error("Something went wrong");
    }
  } else {
    throw Error("Something went wrong fetching build history");
  }
}

const BuildStatusStatistics = z.object({
  pass: z.number(),
  fail: z.number(),
});

type BuildStatistics = z.infer<typeof BuildStatusStatistics>;

export async function fetchBuildStatusStatistics(
  token: string
): Promise<BuildStatistics> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/build-status-statistics`,
    {
      method: "GET",
      headers: {
        Authorization: token,
      },
    }
  );
  const data = await response.json();
  if (response.ok) {
    const parsed = BuildStatusStatistics.parse(data);
    if (parsed) {
      return parsed;
    } else {
      throw Error("Something went wrong");
    }
  } else {
    throw Error("Something went wrong fetching build status statistics");
  }
}