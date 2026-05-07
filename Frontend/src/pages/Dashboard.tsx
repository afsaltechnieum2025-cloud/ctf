import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminQuizReport from '@/components/dashboard/AdminQuizReport';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { API } from '@/utils/api';
import { fetchMyQuizAttempts, type MyQuizAttemptRow } from '@/api/quizAttempts';
import { BookOpen, ClipboardList, LayoutDashboard, Loader2, Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardStats = {
  userCount: number;
  productCount: number;
  courseTopicCount: number;
};

function parseStats(data: unknown): DashboardStats | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const userCount = o.userCount;
  const productCount = o.productCount;
  const courseTopicCount = o.courseTopicCount;
  if (
    typeof userCount !== 'number' ||
    typeof productCount !== 'number' ||
    typeof courseTopicCount !== 'number'
  ) {
    return null;
  }
  return { userCount, productCount, courseTopicCount };
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function quizTypeLabel(t: MyQuizAttemptRow['quizType']): string {
  return t === 'product_mcq' ? 'Product quiz' : 'Course quiz';
}

type StatItem = {
  label: string;
  hint: string;
  Icon: typeof Users;
  valueKey: keyof DashboardStats;
};

const STAT_ITEMS: StatItem[] = [
  { label: 'Users', hint: 'Registered accounts', Icon: Users, valueKey: 'userCount' },
  { label: 'Products', hint: 'Course catalogue entries', Icon: Package, valueKey: 'productCount' },
  { label: 'Course topics', hint: 'Topic modules available', Icon: BookOpen, valueKey: 'courseTopicCount' },
];

export default function Dashboard() {
  const { username, token, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [myAttempts, setMyAttempts] = useState<MyQuizAttemptRow[]>([]);
  const [myAttemptsLoading, setMyAttemptsLoading] = useState(false);
  const [myAttemptsError, setMyAttemptsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      setStatsError(false);
      try {
        const res = await fetch(`${API}/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        const parsed = parseStats(data);
        if (!cancelled) {
          if (parsed) setStats(parsed);
          else {
            setStats(null);
            setStatsError(true);
          }
        }
      } catch {
        if (!cancelled) {
          setStatsError(true);
          setStats(null);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const loadMine = async () => {
      if (!token) return;
      setMyAttemptsLoading(true);
      setMyAttemptsError(null);
      try {
        const rows = await fetchMyQuizAttempts(token);
        if (!cancelled) setMyAttempts(rows);
      } catch (e) {
        if (!cancelled) {
          setMyAttempts([]);
          setMyAttemptsError(e instanceof Error ? e.message : 'Could not load your quiz history');
        }
      } finally {
        if (!cancelled) setMyAttemptsLoading(false);
      }
    };
    loadMine();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loading = Boolean(token) && stats === null && !statsError;

  return (
    <DashboardLayout
      title={`Welcome back, ${username || 'User'}`}
      description="Portal snapshot, your quiz history, and team activity (admins)."
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <LayoutDashboard className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Platform overview</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Live counts from the directory — same data powers navigation and reports.
                </p>
              </div>
            </div>
            {role ? (
              <Badge variant="secondary" className="w-fit shrink-0 capitalize">
                {role}
              </Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAT_ITEMS.map(({ label, hint, Icon, valueKey }, i) => (
              <Card
                key={label}
                className={cn(
                  'border-border/60 bg-card/50 shadow-sm transition-all hover:border-primary/25 hover:shadow-md',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      {loading ? (
                        <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                          <span className="text-sm">Loading…</span>
                        </div>
                      ) : statsError ? (
                        <p className="text-2xl font-bold tabular-nums tracking-tight text-muted-foreground">—</p>
                      ) : (
                        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                          {stats?.[valueKey] ?? '—'}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Your quiz completions</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Product MCQs and course topic quizzes you have finished (newest first).
              </p>
            </div>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm">
            <CardHeader className="space-y-1 border-b border-[#FF6600]/30 bg-[#FF6600]/[0.1] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-[#FF6600]" aria-hidden />
                <CardTitle className="text-base font-semibold text-foreground">Attempt history</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Scores are stored when you open results after a quiz. {myAttempts.length > 0 ? `${myAttempts.length} saved.` : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {myAttemptsLoading ? (
                <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading your history…
                </div>
              ) : myAttemptsError ? (
                <p className="px-4 py-6 text-sm text-destructive sm:px-6" role="alert">
                  {myAttemptsError}
                </p>
              ) : myAttempts.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
                  No saved attempts yet. Complete a product or course quiz — scores are stored when you open results.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-0 border-t border-border/40">
                    <div className="max-h-[min(360px,50vh)] overflow-auto">
                      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-sm">
                          <tr>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                              When
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                              Type
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                              Product / course
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {myAttempts.map((a) => (
                            <tr
                              key={a.id}
                              className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                            >
                              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                                {formatWhen(a.completedAt)}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground sm:px-5">{quizTypeLabel(a.quizType)}</td>
                              <td
                                className="max-w-[220px] truncate px-4 py-2.5 text-sm text-foreground sm:max-w-xs sm:px-5"
                                title={a.subjectSlug}
                              >
                                {a.subjectName ?? a.subjectSlug}
                              </td>
                              <td className="px-4 py-2.5 text-center tabular-nums text-sm font-medium sm:px-5">
                                {a.scoreCorrect} / {a.scoreTotal}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {token && role === 'admin' ? (
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Team quiz activity</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Organisation-wide completion stats and recent attempts (admin only).
              </p>
            </div>
            <AdminQuizReport token={token} />
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
