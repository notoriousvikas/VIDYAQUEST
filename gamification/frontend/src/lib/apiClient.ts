export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

const TOKEN_STORAGE_KEY = 'vidyaquest_access_token';
const USER_STORAGE_KEY = 'vidyaquest_user';
const DASHBOARD_CACHE_KEY = 'vidyaquest_dashboard_cache';
const AVATAR_ITEMS_CACHE_KEY = 'vidyaquest_avatar_items_cache';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  grade?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
  window.sessionStorage.removeItem(AVATAR_ITEMS_CACHE_KEY);
}

export function getCachedDashboard<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedDashboard<T>(data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedAvatarItems<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(AVATAR_ITEMS_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedAvatarItems<T>(data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(AVATAR_ITEMS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    const code = payload?.error?.code ?? 'REQUEST_FAILED';
    const message = payload?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, code);
  }

  return payload.data as T;
}

export const apiClient = {
  register(input: { name: string; email: string; password: string; grade?: string }) {
    return apiFetch<{ user: AuthUser; token: string }>('/identity/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return apiFetch<{ user: AuthUser; token: string }>('/identity/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getSubjects() {
    return apiFetch<
      Array<{
        id: string;
        name: string;
        slug: string;
        description: string;
        icon: string;
        totalMissions: number;
        completedMissions: number;
        completionPercentage: number;
        map: {
          id: string;
          mapName: string;
          mapSlug: string;
          previewAsset: string;
          version: number;
        } | null;
      }>
    >('/student/subjects');
  },

  getSubjectMap(subjectIdOrSlug: string) {
    return apiFetch<import('@/types/worldMap').SubjectMapResponse>(
      `/student/subjects/${encodeURIComponent(subjectIdOrSlug)}/map`,
    );
  },

  startMission(missionId: string) {
    return apiFetch<{
      missionId: string;
      status: 'IN_PROGRESS' | 'COMPLETED';
      attempts: number;
    }>(`/student/map/missions/${encodeURIComponent(missionId)}/start`, {
      method: 'POST',
    });
  },

  completeMission(missionId: string, score = 100) {
    return apiFetch<{
      missionId: string;
      alreadyCompleted: boolean;
      xpAwarded: number;
      leveledUp: boolean;
      starsEarned: 1 | 2 | 3;
      score: number;
      conquerorEvent?: import('@/types/student').ConquerorEventPayload | null;
      unlockedClothingRewards?: import('@/types/student').UnlockedClothingReward[];
      map: import('@/types/worldMap').SubjectMapResponse;
    }>(`/student/map/missions/${encodeURIComponent(missionId)}/complete`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  },

  getStudentDashboard() {
    return apiFetch<import('@/types/student').StudentDashboardData>('/student/dashboard');
  },

  getStudentAvatar() {
    return apiFetch<import('@/types/student').StudentAvatarState>('/student/avatar');
  },

  getStudentAvatarItems() {
    return apiFetch<import('@/types/student').AvatarItem[]>('/student/avatar/items');
  },

  updateStudentAvatar(input: {
    appearance?: Partial<import('@/types/student').AvatarAppearance>;
    equippedItems?: Partial<import('@/types/student').AvatarEquippedItems>;
    activeOutfitId?: string | null;
  }) {
    return apiFetch<import('@/types/student').StudentAvatarState>('/student/avatar', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  getSavedOutfits() {
    return apiFetch<import('@/types/student').SavedOutfit[]>('/student/outfits');
  },

  createSavedOutfit(input: {
    outfitName: string;
    appearance?: Partial<import('@/types/student').AvatarAppearance>;
    equippedItems?: Partial<import('@/types/student').AvatarEquippedItems>;
  }) {
    return apiFetch<import('@/types/student').SavedOutfit>('/student/outfits', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateSavedOutfit(outfitId: string, input: { outfitName?: string; equip?: boolean }) {
    return apiFetch<import('@/types/student').SavedOutfit>(
      `/student/outfits/${encodeURIComponent(outfitId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },

  deleteSavedOutfit(outfitId: string) {
    return apiFetch<{ deleted: boolean; id: string }>(
      `/student/outfits/${encodeURIComponent(outfitId)}`,
      { method: 'DELETE' },
    );
  },

  getStudentAchievements() {
    return apiFetch<import('@/types/student').StudentAchievementItem[]>('/student/achievements');
  },

  getStudentConquerors() {
    return apiFetch<import('@/types/student').SubjectConquerorRecord[]>('/student/conquerors');
  },

  getStudentActivity(limit = 20) {
    return apiFetch<import('@/types/student').StudentActivityItem[]>(
      `/student/activity?limit=${limit}`,
    );
  },

  updateStudentProfile(input: {
    displayName?: string;
    classGrade?: string;
    school?: string;
    schoolLocation?: string;
    preferredLanguage?: string;
    timezone?: string;
    interests?: string[];
    learningPreferences?: Partial<import('@/types/student').StudentProfile['learningPreferences']>;
    accessibilitySettings?: Partial<import('@/types/student').StudentProfile['accessibilitySettings']>;
    leaderboardOptOut?: boolean;
    showSchoolOnLeaderboard?: boolean;
  }) {
    return apiFetch<import('@/types/student').StudentProfile>('/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  getStreak() {
    return apiFetch<import('@/types/student').StreakSummary>('/streak');
  },

  getStreakHistory(days = 30) {
    return apiFetch<import('@/types/student').StreakHistoryItem[]>(`/streak/history?days=${days}`);
  },

  getStreakRewards() {
    return apiFetch<import('@/types/student').StreakRewardItem[]>('/streak/rewards');
  },

  useStreakFreeze() {
    return apiFetch<{
      freezeUsed: boolean;
      protectedDateKey: string;
      summary: import('@/types/student').StreakSummary;
    }>('/streak/freeze/use', { method: 'POST' });
  },

  getLeaderboard(params: {
    type?: import('@/types/student').LeaderboardType;
    period?: import('@/types/student').LeaderboardPeriod;
    subject?: import('@/types/student').LeaderboardSubjectSlug;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.period) query.set('period', params.period);
    if (params.subject) query.set('subject', params.subject);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiFetch<import('@/types/student').LeaderboardPageResponse>(
      `/leaderboard${qs ? `?${qs}` : ''}`,
    );
  },

  getLeaderboardMe(params: {
    type?: import('@/types/student').LeaderboardType;
    period?: import('@/types/student').LeaderboardPeriod;
    subject?: import('@/types/student').LeaderboardSubjectSlug;
  } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.period) query.set('period', params.period);
    if (params.subject) query.set('subject', params.subject);
    const qs = query.toString();
    return apiFetch<import('@/types/student').LeaderboardMeResponse>(
      `/leaderboard/me${qs ? `?${qs}` : ''}`,
    );
  },

  getLeaderboardStudentDetails(studentId: string) {
    return apiFetch<import('@/types/student').PublicLeaderboardProfile>(
      `/leaderboard/${encodeURIComponent(studentId)}`,
    );
  },

  resolveLabForMission(missionId: string) {
    return apiFetch<import('@/types/lab').LabResolveResponse>(
      `/labs/resolve/mission/${encodeURIComponent(missionId)}`,
    );
  },

  startLabAttempt(labId: string, missionId?: string) {
    return apiFetch<{
      labId: string;
      missionId: string;
      status: 'IN_PROGRESS' | 'COMPLETED';
      startedAt: string;
    }>(`/labs/${encodeURIComponent(labId)}/attempt/start`, {
      method: 'POST',
      body: JSON.stringify(missionId ? { missionId } : {}),
    });
  },

  completeLabExperiment(
    labId: string,
    input: {
      missionId?: string;
      completedSteps: number[];
      observations: string[];
      answers: Record<string, number>;
    },
  ) {
    return apiFetch<import('@/types/lab').LabCompleteResponse>(
      `/labs/${encodeURIComponent(labId)}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },

  getCodingLevels() {
    return apiFetch<import('@/types/coding').CodingLevel[]>('/coding/levels');
  },

  getCodingLevel(levelId: string) {
    return apiFetch<import('@/types/coding').CodingLevelWithChallenges>(
      `/coding/levels/${encodeURIComponent(levelId)}`,
    );
  },

  getCodingChallenge(challengeId: string) {
    return apiFetch<import('@/types/coding').PublicCodingChallenge>(
      `/coding/challenges/${encodeURIComponent(challengeId)}`,
    );
  },

  getCodingProgress() {
    return apiFetch<import('@/types/coding').CodingLevelProgress[]>('/coding/progress');
  },

  getCodingLevelProgress(levelId: string) {
    return apiFetch<import('@/types/coding').CodingLevelProgress>(
      `/coding/progress/${encodeURIComponent(levelId)}`,
    );
  },

  runCodingCode(input: {
    challengeId: string;
    language: import('@/types/coding').CodingLanguage;
    code: string;
    customInput?: string;
  }) {
    return apiFetch<import('@/types/coding').CodingRunResult>('/coding/run', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  submitCodingSolution(input: {
    challengeId: string;
    language: import('@/types/coding').CodingLanguage;
    code: string;
  }) {
    return apiFetch<import('@/types/coding').CodingSubmitResult>('/coding/submit', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  requestCodingHint(input: {
    challengeId: string;
    language: import('@/types/coding').CodingLanguage;
    code: string;
    hintLevel: 1 | 2 | 3;
    errorOutput?: string;
    question?: string;
  }) {
    return apiFetch<import('@/types/coding').CodingHintResult>('/coding/hint', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
