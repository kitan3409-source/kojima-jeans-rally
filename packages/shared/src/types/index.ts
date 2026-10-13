export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  order: number;
  /** Only returned to authenticated administrators. */
  qrCodeValue?: string;
  lat: string | null;
  lng: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StampRecord {
  id: string;
  userId: string;
  checkpointId: string;
  acquiredAt: string;
}

export interface User {
  id: string;
  createdAt: string;
}

export interface AcquireStampRequest {
  userId: string;
  qrCodeValue: string;
}

export interface AcquireStampResponse {
  stamp: StampRecord;
  checkpoint: Checkpoint;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface Profile {
  userId: string;
  nickname: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatsPerCheckpoint {
  checkpointId: string;
  name: string;
  order: number;
  count: number;
}

export interface StatsRecent {
  userId: string;
  checkpointId: string;
  acquiredAt: string;
}

export interface Stats {
  totalUsers: number;
  totalStamps: number;
  totalCheckpoints: number;
  completions: number;
  completionRate: number;
  perCheckpoint: StatsPerCheckpoint[];
  recent: StatsRecent[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string | null;
  stamps: number;
  completed: boolean;
  durationMs: number;
  lastAcquiredAt: string;
}

export type SurveyQuestion =
  | { id: string; type: "scale"; label: string; required: boolean; min: number; max: number; minLabel: string; maxLabel: string }
  | { id: string; type: "single" | "multi"; label: string; required: boolean; options: string[] }
  | { id: string; type: "spot"; label: string; required: boolean }
  | { id: string; type: "text"; label: string; required: boolean; maxLength: number };

export type SurveyAnswer = number | string | string[];

export type SurveyAnswers = Record<string, SurveyAnswer>;

export interface SurveyResponse {
  userId: string;
  answers: SurveyAnswers | null;
  updatedAt?: string;
}

export interface SurveyAdminResponse {
  userId: string;
  nickname: string | null;
  stamps: number;
  answers: SurveyAnswers;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResults {
  questions: SurveyQuestion[];
  spots: { id: string; name: string; order: number }[];
  totalCheckpoints: number;
  responses: SurveyAdminResponse[];
}
