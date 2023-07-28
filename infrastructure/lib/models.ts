type EpochMilliseconds = number;

export type BuildStatusMessage = {
  type: 'build-status';
  id: string;
  status: "pass" | "fail";
  timestamp: EpochMilliseconds;
};
