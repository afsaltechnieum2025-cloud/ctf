import { API } from '@/utils/api';
import { triggerNotifyRefresh } from '@/utils/notifyRefresh';

export type QuizType = 'product_mcq' | 'course_topic_quiz';

export type SubmitQuizAttemptBody = {
  quizType: QuizType;
  subjectSlug: string;
  scoreCorrect: number;
  scoreTotal: number;
};

export async function submitQuizAttempt(token: string, body: SubmitQuizAttemptBody): Promise<{ ok: boolean; id?: number }> {
  const res = await fetch(`${API}/quiz-attempts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j?.error) detail = String(j.error);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const payload = (await res.json()) as { ok: boolean; id?: number };
  triggerNotifyRefresh();
  return payload;
}

export type AdminQuizUserRow = {
  id: number;
  name: string;
  email: string;
  fullName: string | null;
  role: string;
  productQuizAttempts: number;
  courseQuizAttempts: number;
  lastProductAt: string | null;
  lastCourseAt: string | null;
  productAvgPercent: number | null;
  courseAvgPercent: number | null;
  /** Distinct product display names from quiz attempts (comma-separated) */
  productNamesList?: string | null;
  /** Distinct course topic titles from quiz attempts (comma-separated) */
  courseNamesList?: string | null;
};

export type MyQuizAttemptRow = {
  id: number;
  quizType: QuizType;
  subjectSlug: string;
  /** Resolved from DB: product name or course topic title when available */
  subjectName?: string;
  scoreCorrect: number;
  scoreTotal: number;
  completedAt: string;
};

export async function fetchMyQuizAttempts(token: string): Promise<MyQuizAttemptRow[]> {
  const res = await fetch(`${API}/quiz-attempts/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j?.error) detail = String(j.error);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await res.json()) as { attempts?: MyQuizAttemptRow[] };
  return Array.isArray(data.attempts) ? data.attempts : [];
}

export type AdminQuizAttemptRow = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  quizType: QuizType;
  subjectSlug: string;
  subjectName?: string;
  scoreCorrect: number;
  scoreTotal: number;
  completedAt: string;
};

export type UserQuizReportUser = {
  id: number;
  name: string;
  fullName: string | null;
  email: string;
  role: string;
  createdAt: string;
};

export type UserQuizReportSummary = {
  productQuizAttempts: number;
  courseQuizAttempts: number;
  productAvgPercent: number | null;
  courseAvgPercent: number | null;
};

export type UserQuizReportAttempt = {
  id: number;
  quizType: QuizType;
  subjectSlug: string;
  subjectName?: string;
  scoreCorrect: number;
  scoreTotal: number;
  completedAt: string;
};

export type UserQuizReportResponse = {
  user: UserQuizReportUser;
  summary: UserQuizReportSummary;
  attempts: UserQuizReportAttempt[];
};

export async function fetchUserQuizReport(token: string, userId: number): Promise<UserQuizReportResponse> {
  const res = await fetch(`${API}/quiz-attempts/admin/users/${userId}/report`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j?.error) detail = String(j.error);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<UserQuizReportResponse>;
}

export async function fetchAdminQuizOverview(token: string): Promise<{ users: AdminQuizUserRow[]; attempts: AdminQuizAttemptRow[] }> {
  const res = await fetch(`${API}/quiz-attempts/admin/overview`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j?.error) detail = String(j.error);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<{ users: AdminQuizUserRow[]; attempts: AdminQuizAttemptRow[] }>;
}
