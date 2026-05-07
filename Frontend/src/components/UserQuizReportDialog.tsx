import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchUserQuizReport, type UserQuizReportResponse } from '@/api/quizAttempts';
import { createUserQuizReportDocxBlob } from '@/utils/buildUserQuizReportDocx';
import { BookOpen, Download, Loader2, Mail, Package, User } from 'lucide-react';
import { toast } from 'sonner';

export type QuizReportUserRef = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  full_name: string | null;
  created_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: QuizReportUserRef | null;
  token: string | null;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function quizLabel(t: string): string {
  return t === 'product_mcq' ? 'Product quiz' : 'Course quiz';
}

export function UserQuizReportDialog({ open, onOpenChange, user, token }: Props) {
  const [data, setData] = useState<UserQuizReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user || !token) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetchUserQuizReport(token, user.id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : 'Failed to load quiz report');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, token]);

  const downloadWord = async () => {
    if (!data) {
      toast.error('Nothing to download yet.');
      return;
    }
    setDownloading(true);
    try {
      const blob = await createUserQuizReportDocxBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safe = data.user.name.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'user';
      a.href = url;
      a.download = `quiz-report-${safe}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Word report downloaded');
    } catch {
      toast.error('Failed to generate Word report');
    } finally {
      setDownloading(false);
    }
  };

  const displayName = user?.name ?? '';
  const displayEmail = user?.email ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <User className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            Quiz activity — {displayName}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {displayEmail}
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-sm">Loading quiz data…</span>
          </div>
        ) : error ? (
          <p className="py-6 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="border-border/60 bg-card/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Product quizzes</p>
                    <p className="text-2xl font-bold tabular-nums">{data.summary.productQuizAttempts}</p>
                    {data.summary.productAvgPercent != null ? (
                      <p className="text-xs text-muted-foreground">Avg score: {data.summary.productAvgPercent}%</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No attempts yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Course quizzes</p>
                    <p className="text-2xl font-bold tabular-nums">{data.summary.courseQuizAttempts}</p>
                    {data.summary.courseAvgPercent != null ? (
                      <p className="text-xs text-muted-foreground">Avg score: {data.summary.courseAvgPercent}%</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No attempts yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">All attempts ({data.attempts.length})</h4>
              {data.attempts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  This user has not completed any product or course quizzes yet.
                </p>
              ) : (
                <div className="max-h-[280px] overflow-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 font-medium">When</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Product / course</th>
                        <th className="px-3 py-2 text-center font-medium">Score</th>
                        <th className="px-3 py-2 text-center font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attempts.map((a) => {
                        const pct = a.scoreTotal > 0 ? Math.round((100 * a.scoreCorrect * 10) / a.scoreTotal) / 10 : 0;
                        return (
                          <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                              {formatWhen(a.completedAt)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{quizLabel(a.quizType)}</td>
                            <td
                              className="max-w-[200px] truncate px-3 py-2 text-sm text-foreground"
                              title={a.subjectSlug}
                            >
                              {a.subjectName ?? a.subjectSlug}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums font-medium">
                              {a.scoreCorrect} / {a.scoreTotal}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => void downloadWord()}
            disabled={loading || downloading || !!error || !data}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            Download report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
