import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { submitQuizAttempt } from '@/api/quizAttempts';
import { useCourseLinkedProductSlugs } from '@/hooks/useCourseLinkedProductSlugs';
import { useProductMcqQuiz } from '@/hooks/useProductMcqQuiz';
import { useLearningProducts } from '@/hooks/useLearningProducts';
import { isProductLinkedToCourses } from '@/data/courseTopics';
import { getProductBySlug } from '@/data/productCatalog';
import { createProductQuizSummaryDocxBlob } from '@/utils/buildProductQuizSummaryDocx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, Download, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductMcqTest() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const { slugs: courseLinkedSlugs, loading: courseLinksLoading } = useCourseLinkedProductSlugs();
  const { products: apiProducts, loading: productsLoading } = useLearningProducts();
  const { questions, loading: quizLoading, error: quizError } = useProductMcqQuiz(slug);

  const product = useMemo(() => {
    if (!slug) return undefined;
    return apiProducts.find((p) => p.slug === slug) ?? getProductBySlug(slug);
  }, [slug, apiProducts]);

  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  useEffect(() => {
    setStep(0);
    setAnswers(Array(total).fill(null));
    setPhase('quiz');
  }, [slug, total]);

  const inCourses = Boolean(
    slug && (courseLinksLoading ? isProductLinkedToCourses(slug) : courseLinkedSlugs.includes(slug)),
  );

  const score = useMemo(() => {
    if (!questions.length || phase !== 'results') return { correct: 0, wrong: 0 };
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      const picked = answers[i];
      if (picked === null || picked === undefined) continue;
      if (picked === questions[i].correctIndex) correct += 1;
    }
    return { correct, wrong: questions.length - correct };
  }, [questions, answers, phase]);

  const questionSummaries = useMemo(
    () =>
      questions.map((question, index) => {
        const selectedIndex = answers[index];
        return {
          id: `${slug ?? 'product'}-summary-${index}`,
          index,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          selectedIndex,
          isCorrect: selectedIndex === question.correctIndex,
        };
      }),
    [answers, questions, slug],
  );

  const correctSummaries = useMemo(
    () => questionSummaries.filter((summary) => summary.isCorrect),
    [questionSummaries],
  );
  const incorrectSummaries = useMemo(
    () => questionSummaries.filter((summary) => !summary.isCorrect),
    [questionSummaries],
  );

  const downloadSummaryAsWord = async () => {
    if (!product) return;
    try {
      const blob = await createProductQuizSummaryDocxBlob({
        productName: product.name,
        scoreCorrect: score.correct,
        scoreTotal: total,
        correctItems: correctSummaries,
        incorrectItems: incorrectSummaries,
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeProductName = product.name.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'product';
      link.href = objectUrl;
      link.download = `quiz-summary-${safeProductName}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success('Word report downloaded');
    } catch {
      toast.error('Failed to generate Word report');
    }
  };

  const baseInvalid = !slug || !product || !inCourses;

  if (baseInvalid) {
    return (
      <DashboardLayout title="Products Quiz">
        <div className="mx-auto w-full max-w-lg min-w-0 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {!slug || !product
              ? 'We could not find this vendor or the link is invalid.'
              : !inCourses
                ? 'Products Quiz only includes vendors linked from Courses. Open a course topic to see which vendors are in scope.'
                : null}
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/product-mcqs">Back to Products Quiz</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (productsLoading && !apiProducts.length) {
    return (
      <DashboardLayout title="Products Quiz">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  if (quizLoading) {
    return (
      <DashboardLayout title={product ? `${product.name} — Products Quiz` : 'Products Quiz'}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading quiz…
        </div>
      </DashboardLayout>
    );
  }

  if (quizError) {
    return (
      <DashboardLayout title="Products Quiz">
        <p className="text-sm text-destructive" role="alert">
          {quizError}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/product-mcqs">Back to Products Quiz</Link>
        </Button>
      </DashboardLayout>
    );
  }

  if (!questions.length) {
    return (
      <DashboardLayout title="Products Quiz">
        <div className="mx-auto w-full max-w-lg min-w-0 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This product does not have any quiz questions in the database yet. Add rows to{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">product_mcq_questions</code> for this vendor.
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/product-mcqs">Back to Products Quiz</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const current = questions[step];
  const stem = current.question?.trim() || `Question ${step + 1}`;

  const setChoice = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
  };

  const goDone = () => {
    if (!slug || !questions.length) {
      setPhase('results');
      return;
    }
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      const picked = answers[i];
      if (picked !== null && picked !== undefined && picked === questions[i].correctIndex) {
        correct += 1;
      }
    }
    setPhase('results');
    if (token) {
      submitQuizAttempt(token, {
        quizType: 'product_mcq',
        subjectSlug: slug,
        scoreCorrect: correct,
        scoreTotal: questions.length,
      }).catch(() => {
        /* non-blocking */
      });
    }
  };

  const retake = () => {
    setStep(0);
    setAnswers(Array(total).fill(null));
    setPhase('quiz');
  };

  const progressPct = total > 0 ? ((step + 1) / total) * 100 : 0;

  if (phase === 'results') {
    return (
      <DashboardLayout title={`${product.name} — Results`}>
        <div className="mx-auto mb-6 w-full max-w-3xl min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
            <Link to="/product-mcqs">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Products Quiz
            </Link>
          </Button>
        </div>

        <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
          <Card className="min-w-0 border-border/60 bg-card/40 shadow-md">
            <CardHeader className="min-w-0 space-y-1 border-b border-border/60 pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Results
              </CardDescription>
              <CardTitle className="min-w-0 break-words text-2xl font-semibold tracking-tight text-pretty">
                {product.name}
              </CardTitle>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                You scored {score.correct} / {total}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {score.wrong} incorrect or unanswered ·{' '}
                {total > 0 ? Math.round((100 * score.correct) / total) : 0}% correct
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid min-w-0 grid-cols-2 gap-4 sm:gap-6">
                <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-5 text-center sm:px-4">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" aria-hidden />
                    Correct
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.correct}</p>
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-5 text-center sm:px-4">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <XCircle className="h-4 w-4 text-destructive" aria-hidden />
                    Incorrect / skipped
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.wrong}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto sm:min-w-[10rem]" onClick={retake}>
                Retake quiz
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Summary
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] w-[95vw] max-w-4xl overflow-hidden p-0">
                  <DialogHeader className="flex-row items-start justify-between border-b border-border/60 px-6 py-4 pr-14 text-left">
                    <div className="space-y-1">
                      <DialogTitle className="text-xl">Question Summary</DialogTitle>
                      <DialogDescription>
                        Review each question grouped by whether your answer was correct or incorrect.
                      </DialogDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void downloadSummaryAsWord()}>
                      <Download className="h-4 w-4" aria-hidden />
                      Download
                    </Button>
                  </DialogHeader>

                  <div className="max-h-[calc(85vh-88px)] overflow-y-auto px-6 py-5">
                    <Tabs defaultValue="correct" className="min-w-0">
                      <TabsList className="mb-4 grid w-full grid-cols-2">
                        <TabsTrigger value="correct">Correct ({correctSummaries.length})</TabsTrigger>
                        <TabsTrigger value="incorrect">Incorrect ({incorrectSummaries.length})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="correct" className="space-y-3">
                        {!correctSummaries.length ? (
                          <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                            No correct answers yet.
                          </p>
                        ) : (
                          correctSummaries.map((summary) => (
                            <div key={summary.id} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                              <p className="text-sm font-medium text-foreground">
                                Q{summary.index + 1}. {summary.question}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Your answer:{' '}
                                <span className="font-medium text-foreground">
                                  {summary.selectedIndex !== null && summary.selectedIndex !== undefined
                                    ? summary.options[summary.selectedIndex]
                                    : 'Not answered'}
                                </span>
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Correct answer:{' '}
                                <span className="font-medium text-foreground">
                                  {summary.options[summary.correctIndex]}
                                </span>
                              </p>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="incorrect" className="space-y-3">
                        {!incorrectSummaries.length ? (
                          <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                            Great job. No incorrect answers.
                          </p>
                        ) : (
                          incorrectSummaries.map((summary) => (
                            <div key={summary.id} className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                              <p className="text-sm font-medium text-foreground">
                                Q{summary.index + 1}. {summary.question}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Your answer:{' '}
                                <span className="font-medium text-foreground">
                                  {summary.selectedIndex !== null && summary.selectedIndex !== undefined
                                    ? summary.options[summary.selectedIndex]
                                    : 'Not answered'}
                                </span>
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Correct answer:{' '}
                                <span className="font-medium text-foreground">
                                  {summary.options[summary.correctIndex]}
                                </span>
                              </p>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="default" className="w-full sm:w-auto" asChild>
                <Link to="/product-mcqs">Choose another vendor</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isLast = step === total - 1;
  const selected = answers[step];

  return (
    <DashboardLayout
      title={`${product.name} — Products Quiz`}
      description={`Question ${step + 1} of ${total}`}
    >
      <div className="mx-auto mb-6 w-full max-w-3xl min-w-0">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to="/product-mcqs">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Products Quiz
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">Progress</span>
            <span className="tabular-nums text-muted-foreground">
              {step + 1} / {total}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={`Question ${step + 1} of ${total}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Card className="min-w-0 border-border/60 bg-card/40 shadow-md">
          <CardHeader className="min-w-0 space-y-1 border-b border-border/60 pb-4">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.name}
            </CardDescription>
            <CardTitle className="min-w-0 break-words text-left text-lg font-semibold leading-snug text-pretty sm:text-xl">
              {stem}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 pt-6">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Select one answer, then use Next to continue. On the last question, choose View results to see your
              score.
            </p>
            <fieldset className="min-w-0 space-y-3">
              <legend className="sr-only">{stem}</legend>
              {current.options.map((label, i) => {
                const id = `quiz-${slug}-${step}-${i}`;
                const checked = selected === i;
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={cn(
                      'flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 text-left text-sm leading-snug transition-colors',
                      checked
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-background hover:bg-muted/40',
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`quiz-${slug}-${step}`}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                      checked={checked}
                      onChange={() => setChoice(i)}
                    />
                    <span className="min-w-0 flex-1 text-foreground">{label}</span>
                  </label>
                );
              })}
            </fieldset>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto sm:min-w-[8.5rem]"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </Button>
            {!isLast ? (
              <Button
                type="button"
                className="w-full sm:w-auto sm:min-w-[8.5rem]"
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              >
                Next
              </Button>
            ) : (
              <Button type="button" className="w-full sm:w-auto sm:min-w-[8.5rem]" onClick={goDone}>
                View results
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
