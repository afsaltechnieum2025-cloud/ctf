import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getCourseTopicBySlug } from '@/data/courseTopics';
import { getCourseTopicQuizBySlug } from '@/data/courseTopicQuizData';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CourseTopicQuiz() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const topic = topicSlug ? getCourseTopicBySlug(topicSlug) : undefined;
  const questions = topicSlug ? getCourseTopicQuizBySlug(topicSlug) : undefined;
  const total = questions?.length ?? 0;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  useEffect(() => {
    setStep(0);
    setAnswers(Array(total).fill(-1));
    setPhase('quiz');
  }, [topicSlug, total]);

  const invalid = !topicSlug || !topic || !questions || total === 0;

  const score = useMemo(() => {
    if (!questions) return { correct: 0, wrong: 0 };
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      if (answers[i] === questions[i].correctIndex) correct += 1;
    }
    return { correct, wrong: questions.length - correct };
  }, [answers, questions]);

  if (invalid) {
    return (
      <DashboardLayout title="Topic Quiz">
        <p className="text-muted-foreground">
          This topic does not have a quiz yet, or the link is invalid.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </DashboardLayout>
    );
  }

  const progressPct = ((step + 1) / total) * 100;
  const current = questions[step];
  const isLast = step === total - 1;
  const selected = answers[step];

  const setChoice = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
  };

  if (phase === 'results') {
    return (
      <DashboardLayout title={`${topic.title} — Quiz Results`}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
            <Link to={`/courses/topics/${topic.slug}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to topic
            </Link>
          </Button>
        </div>

        <div className="max-w-3xl space-y-6">
          <Card className="border-border/60 bg-card/40 shadow-md">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Topic quiz results
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">{topic.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {score.correct} of {total} correct
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
                    Incorrect
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.wrong}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 bg-muted/20 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(0);
                  setAnswers(Array(total).fill(-1));
                  setPhase('quiz');
                }}
              >
                Retake quiz
              </Button>
              <Button asChild>
                <Link to={`/courses/topics/${topic.slug}`}>Return to topic</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${topic.title} — Topic Quiz`} description={`Question ${step + 1} of ${total}`}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to={`/courses/topics/${topic.slug}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to topic
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
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

        <Card className="border-border/60 bg-card/40 shadow-md">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {topic.title}
            </CardDescription>
            <CardTitle className="text-left text-lg font-semibold leading-snug sm:text-xl">
              {current.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <fieldset className="space-y-3">
              <legend className="sr-only">{current.question}</legend>
              {current.options.map((option, idx) => {
                const id = `topic-quiz-${topic.slug}-${step}-${idx}`;
                const checked = selected === idx;
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
                      name={`topic-quiz-${topic.slug}-${step}`}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      checked={checked}
                      onChange={() => setChoice(idx)}
                    />
                    <span className="text-foreground">{option}</span>
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
              <Button type="button" onClick={() => setStep((s) => Math.min(total - 1, s + 1))}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={() => setPhase('results')}>
                View results
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
