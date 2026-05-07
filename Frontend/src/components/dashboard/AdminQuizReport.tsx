import { useEffect, useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAdminQuizOverview, type AdminQuizAttemptRow, type AdminQuizUserRow } from '@/api/quizAttempts';
import { BarChart3, Loader2 } from 'lucide-react';

type Props = {
  token: string;
};

function formatPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v}%`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function quizLabel(t: AdminQuizAttemptRow['quizType']): string {
  return t === 'product_mcq' ? 'Product quiz' : 'Course quiz';
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-0 border-t border-border/40">
        <div className="max-h-[min(420px,55vh)] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default function AdminQuizReport({ token }: Props) {
  const [users, setUsers] = useState<AdminQuizUserRow[]>([]);
  const [attempts, setAttempts] = useState<AdminQuizAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminQuizOverview(token)
      .then((data) => {
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load quiz report');
          setUsers([]);
          setAttempts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="space-y-1 border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <CardTitle className="text-base font-semibold">Quiz activity (all users)</CardTitle>
          </div>
          <CardDescription>Loading report…</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 px-4 py-8 text-muted-foreground sm:px-6">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          <span className="text-sm">Loading…</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="space-y-1 border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-6">
          <CardTitle className="text-base font-semibold">Quiz activity (all users)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-6 sm:px-6">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="space-y-1 border-b border-[#FF6600]/30 bg-[#FF6600]/[0.1] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 shrink-0 text-[#FF6600]" aria-hidden />
            <CardTitle className="text-base font-semibold text-foreground sm:text-lg">Per-user summary</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Distinct products and course topics each user has completed, with average scores. Hover a cell to see attempt
            counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <TableShell>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Products
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Avg %
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Course topics
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Avg %
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="max-w-[220px] truncate px-4 py-2.5 text-foreground sm:px-5">{u.email}</td>
                    <td
                      className="max-w-[200px] break-words px-4 py-2.5 text-sm leading-snug text-foreground sm:max-w-[280px] sm:px-5"
                      title={
                        u.productQuizAttempts > 0
                          ? `${u.productQuizAttempts} product quiz attempt(s)`
                          : undefined
                      }
                    >
                      {u.productNamesList?.trim() ? u.productNamesList.trim() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-center tabular-nums text-muted-foreground sm:px-5">
                      {formatPct(u.productAvgPercent)}
                    </td>
                    <td
                      className="max-w-[200px] break-words px-4 py-2.5 text-sm leading-snug text-foreground sm:max-w-[280px] sm:px-5"
                      title={
                        u.courseQuizAttempts > 0
                          ? `${u.courseQuizAttempts} course quiz attempt(s)`
                          : undefined
                      }
                    >
                      {u.courseNamesList?.trim() ? u.courseNamesList.trim() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-center tabular-nums text-muted-foreground sm:px-5">
                      {formatPct(u.courseAvgPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="space-y-1 border-b border-[#FF6600]/30 bg-[#FF6600]/[0.1] px-4 py-4 sm:px-6">
          <CardTitle className="text-base font-semibold text-foreground sm:text-lg">Recent quiz attempts</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest completions (up to 400) with user, type, subject, and score.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {attempts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">No attempts recorded yet.</p>
          ) : (
            <TableShell>
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-sm">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                      When
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                      User
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
                  {attempts.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                        {formatWhen(a.completedAt)}
                      </td>
                      <td className="px-4 py-2.5 sm:px-5">
                        <div className="font-medium text-foreground">{a.userName}</div>
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground">{a.userEmail}</div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground sm:px-5">{quizLabel(a.quizType)}</td>
                      <td
                        className="max-w-[200px] truncate px-4 py-2.5 text-sm text-foreground sm:max-w-[260px] sm:px-5"
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
            </TableShell>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
