import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isProductLinkedToCourses } from '@/data/courseTopics';
import { getProductBySlug } from '@/data/productCatalog';
import { getMcqSetForSlug, MCQ_QUESTION_STEMS } from '@/data/productMcqData';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOTAL = MCQ_QUESTION_STEMS.length;

export default function ProductMcqTest() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const questions = slug ? getMcqSetForSlug(slug) : undefined;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(TOTAL).fill(null));
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  useEffect(() => {
    setStep(0);
    setAnswers(Array(TOTAL).fill(null));
    setPhase('quiz');
  }, [slug]);

  const inCourses = Boolean(slug && isProductLinkedToCourses(slug));
  const invalid =
    !slug || !product || !inCourses || !questions || questions.length !== TOTAL;

  const score = useMemo(() => {
    if (!questions || phase !== 'results') return { correct: 0, wrong: 0 };
    let correct = 0;
    for (let i = 0; i < TOTAL; i++) {
      const picked = answers[i];
      if (picked === null || picked === undefined) continue;
      if (picked === questions[i].correctIndex) correct += 1;
    }
    const answeredWrongOrSkipped = TOTAL - correct;
    return { correct, wrong: answeredWrongOrSkipped };
  }, [questions, answers, phase]);

  if (invalid) {
    return (
      <DashboardLayout title="Products Quiz">
        <p className="text-muted-foreground">
          {!product
            ? 'We could not find this vendor or the link is invalid.'
            : !inCourses
              ? 'Products Quiz only includes vendors linked from Courses. Open a course topic to see which vendors are in scope.'
              : 'This product does not have a quiz set up yet.'}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/product-mcqs">Back to Products Quiz</Link>
        </Button>
      </DashboardLayout>
    );
  }

  const current = questions[step];
  const stem = MCQ_QUESTION_STEMS[step];

  const setChoice = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
  };

  const goDone = () => setPhase('results');

  const retake = () => {
    setStep(0);
    setAnswers(Array(TOTAL).fill(null));
    setPhase('quiz');
  };

  const progressPct = ((step + 1) / TOTAL) * 100;

  if (phase === 'results') {
    return (
      <DashboardLayout title={`${product.name} — Results`}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
            <Link to="/product-mcqs">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Products Quiz
            </Link>
          </Button>
        </div>

        <div className="max-w-3xl space-y-6">
          <Card className="border-border/60 bg-card/40 shadow-md">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Results
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {score.correct} of {TOTAL} correct · {score.wrong} incorrect or unanswered
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="rounded-lg border border-border bg-card px-4 py-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" aria-hidden />
                    Correct
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.correct}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <XCircle className="h-4 w-4 text-destructive" aria-hidden />
                    Incorrect / skipped
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.wrong}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 bg-muted/20 pt-6">
              <Button type="button" variant="outline" onClick={retake}>
                Retake quiz
              </Button>
              <Button variant="default" asChild>
                <Link to="/product-mcqs">Choose another vendor</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isLast = step === TOTAL - 1;
  const selected = answers[step];

  return (
    <DashboardLayout
      title={`${product.name} — Products Quiz`}
      description={`Question ${step + 1} of ${TOTAL}`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to="/product-mcqs">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Products Quiz
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progress</span>
            <span className="tabular-nums text-muted-foreground">
              {step + 1} / {TOTAL}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-label={`Question ${step + 1} of ${TOTAL}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Card className="border-border/60 bg-card/40 shadow-md">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.name}
            </CardDescription>
            <CardTitle className="text-left text-lg font-semibold leading-snug sm:text-xl">{stem}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Select one answer, then use Next to continue. On the last question, choose View results to see your
              score.
            </p>
            <fieldset className="space-y-3">
              <legend className="sr-only">{stem}</legend>
              {current.options.map((label, i) => {
                const id = `quiz-${slug}-${step}-${i}`;
                const checked = selected === i;
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 text-sm leading-snug transition-colors',
                      checked
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-background hover:bg-muted/40',
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`quiz-${slug}-${step}`}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      checked={checked}
                      onChange={() => setChoice(i)}
                    />
                    <span className="text-foreground">{label}</span>
                  </label>
                );
              })}
            </fieldset>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </Button>
            {!isLast ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={goDone}>
                View results
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
