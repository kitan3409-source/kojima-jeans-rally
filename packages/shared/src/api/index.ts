const API_BASE = ""; // same origin via Vite proxy

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? body.message ?? res.statusText, res.status);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

import type {
  Checkpoint,
  StampRecord,
  AcquireStampResponse,
  Profile,
  Stats,
  LeaderboardEntry,
  SurveyQuestion,
  SurveyAnswers,
  SurveyResponse,
  SurveyResults,
} from "../types/index.js";

export const api = {
  getCheckpoints(adminToken?: string): Promise<Checkpoint[]> {
    return request<Checkpoint[]>("/api/checkpoints", adminToken ? { headers: { "X-Admin-Token": adminToken } } : undefined);
  },
  createCheckpoint(data: { name: string; description: string; order: number; qrCodeValue: string; lat?: string; lng?: string }, adminToken: string): Promise<Checkpoint> {
    return request<Checkpoint>("/api/checkpoints", {
      method: "POST",
      headers: { "X-Admin-Token": adminToken },
      body: JSON.stringify(data),
    });
  },
  updateCheckpoint(id: string, data: Partial<{ name: string; description: string; order: number; qrCodeValue: string }>, adminToken: string): Promise<Checkpoint> {
    return request<Checkpoint>(`/api/checkpoints/${id}`, {
      method: "PUT",
      headers: { "X-Admin-Token": adminToken },
      body: JSON.stringify(data),
    });
  },
  deleteCheckpoint(id: string, adminToken: string): Promise<void> {
    return request<void>(`/api/checkpoints/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Token": adminToken },
    });
  },
  getStamps(userId: string): Promise<StampRecord[]> {
    return request<StampRecord[]>(`/api/stamps/${userId}`);
  },
  acquireStamp(userId: string, qrCodeValue: string): Promise<AcquireStampResponse> {
    return request<AcquireStampResponse>("/api/stamps/acquire", {
      method: "POST",
      body: JSON.stringify({ userId, qrCodeValue }),
    });
  },
  ensureUser(userId: string): Promise<{ id: string }> {
    return request<{ id: string }>(`/api/users/ensure/${userId}`);
  },
  async getQrBlob(checkpointId: string, adminToken: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/qr/${checkpointId}`, { headers: { "X-Admin-Token": adminToken } });
    if (!res.ok) throw new ApiError(res.statusText, res.status);
    return res.blob();
  },
  verifyAdmin(adminToken: string): Promise<{ ok: true }> {
    return request<{ ok: true }>("/api/admin/verify", { headers: { "X-Admin-Token": adminToken } });
  },
  getStats(adminToken?: string): Promise<Stats> {
    return request<Stats>("/api/stats", adminToken ? { headers: { "X-Admin-Token": adminToken } } : undefined);
  },
  getLeaderboard(limit = 20, adminToken?: string): Promise<LeaderboardEntry[]> {
    return request<LeaderboardEntry[]>(`/api/stats/leaderboard?limit=${limit}`, adminToken ? { headers: { "X-Admin-Token": adminToken } } : undefined);
  },
  getProfile(userId: string): Promise<Profile> {
    return request<Profile>(`/api/profile/${userId}`);
  },
  updateProfile(userId: string, nickname: string): Promise<Profile> {
    return request<Profile>(`/api/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ nickname }),
    });
  },
  getSurveyQuestions(): Promise<SurveyQuestion[]> {
    return request<SurveyQuestion[]>("/api/survey/questions");
  },
  getSurvey(userId: string): Promise<SurveyResponse> {
    return request<SurveyResponse>(`/api/survey/${userId}`);
  },
  submitSurvey(userId: string, answers: SurveyAnswers): Promise<SurveyResponse> {
    return request<SurveyResponse>(`/api/survey/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ answers }),
    });
  },
  getSurveyResults(adminToken: string): Promise<SurveyResults> {
    return request<SurveyResults>("/api/survey/responses", { headers: { "X-Admin-Token": adminToken } });
  },
};
