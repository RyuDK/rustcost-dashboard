import type { IsoDateTimeString } from "@/shared/api/base";

export interface InfoVersion {
  date: string;
  major: string;
  minor: string;
  git_version: string;
  git_commit: string;
  build_date: string;
  go_version: string;
  compiler: string;
  platform: string;
  updated_at: IsoDateTimeString;
}

