import { useEffect, useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAdminQuizOverview, type AdminQuizUserRow } from '@/api/quizAttempts';
import { BarChart3, Loader2 } from 'lucide-react';

type Props = {
  token: string;
};

function formatPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v}%`;
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-0 border-t border-[#FF6600]/30">
        <div className="max-h-[min(420px,55vh)] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default function AdminQuizReport({ token }: Props) {
  const [users, setUsers] = useState<AdminQuizUserRow[]>([]);
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
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load quiz report');
          setUsers([]);
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
            <thead className="sticky top-0 z-10 border-b-2 border-[#FF6600]/35 bg-muted/90 backdrop-blur-sm">
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
                  className="border-b border-[#FF6600]/25 transition-colors last:border-b-0 hover:bg-muted/30"
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
  );
}
