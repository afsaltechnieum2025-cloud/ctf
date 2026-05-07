import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { submitQuizAttempt } from '@/api/quizAttempts';
import { useCourseTopicBySlug } from '@/hooks/useCourseTopicBySlug';
import { useTopicQuiz } from '@/hooks/useTopicQuiz';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CourseTopicQuiz() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const { token } = useAuth();
  const { topic, loading: topicLoading, error: topicError } = useCourseTopicBySlug(topicSlug);
  const { questions, loading: quizLoading, error: quizError } = useTopicQuiz(topicSlug);
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  useEffect(() => {
    setStep(0);
    setAnswers(Array(total).fill(-1));
    setPhase('quiz');
  }, [topicSlug, total]);

  const score = useMemo(() => {
    if (!questions.length) return { correct: 0, wrong: 0 };
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      if (answers[i] === questions[i].correctIndex) correct += 1;
    }
    return { correct, wrong: questions.length - correct };
  }, [answers, questions]);

  if (topicLoading || quizLoading) {
    return (
      <DashboardLayout title="Topic Quiz">
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Loading quiz…
        </p>
      </DashboardLayout>
    );
  }

  if (topicError || quizError) {
    return (
      <DashboardLayout title="Topic Quiz">
        <p className="text-sm text-destructive" role="alert">
          {topicError || quizError}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </DashboardLayout>
    );
  }

  const invalid = !topicSlug || !topic || total === 0;

  if (invalid) {
    return (
      <DashboardLayout title="Topic Quiz">
        <div className="mx-auto w-full max-w-lg min-w-0 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This topic does not have a quiz yet, or the link is invalid.
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
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

  const finishQuiz = () => {
    if (!topicSlug || !questions.length) {
      setPhase('results');
      return;
    }
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      if (answers[i] === questions[i].correctIndex) correct += 1;
    }
    setPhase('results');
    if (token) {
      submitQuizAttempt(token, {
        quizType: 'course_topic_quiz',
        subjectSlug: topicSlug,
        scoreCorrect: correct,
        scoreTotal: questions.length,
      }).catch(() => {
        /* non-blocking */
      });
    }
  };

  if (phase === 'results') {
    return (
      <DashboardLayout title={`${topic.title} — Quiz Results`}>
        <div className="mx-auto mb-6 w-full max-w-3xl min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
            <Link to={`/courses/topics/${topic.slug}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to topic
            </Link>
          </Button>
        </div>

        <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
          <Card className="min-w-0 border-border/60 bg-card/40 shadow-md">
            <CardHeader className="min-w-0 space-y-1 border-b border-border/60 pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Topic quiz results
              </CardDescription>
              <CardTitle className="min-w-0 break-words text-2xl font-semibold tracking-tight text-pretty">
                {topic.title}
              </CardTitle>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                You scored {score.correct} / {total}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {score.wrong} incorrect · {total > 0 ? Math.round((100 * score.correct) / total) : 0}% correct
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
                    Incorrect
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{score.wrong}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[10rem]"
                onClick={() => {
                  setStep(0);
                  setAnswers(Array(total).fill(-1));
                  setPhase('quiz');
                }}
              >
                Retake quiz
              </Button>
              <Button className="w-full sm:w-auto" asChild>
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
      <div className="mx-auto mb-6 w-full max-w-3xl min-w-0">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to={`/courses/topics/${topic.slug}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to topic
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
              {topic.title}
            </CardDescription>
            <CardTitle className="min-w-0 break-words text-left text-lg font-semibold leading-snug text-pretty sm:text-xl">
              {current.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="min-w-0 pt-6">
            <fieldset className="min-w-0 space-y-3">
              <legend className="sr-only">{current.question}</legend>
              {current.options.map((option, idx) => {
                const id = `topic-quiz-${topic.slug}-${step}-${idx}`;
                const checked = selected === idx;
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
                      name={`topic-quiz-${topic.slug}-${step}`}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                      checked={checked}
                      onChange={() => setChoice(idx)}
                    />
                    <span className="min-w-0 flex-1 text-foreground">{option}</span>
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
              <Button type="button" className="w-full sm:w-auto sm:min-w-[8.5rem]" onClick={() => setStep((s) => Math.min(total - 1, s + 1))}>
                Next
              </Button>
            ) : (
              <Button type="button" className="w-full sm:w-auto sm:min-w-[8.5rem]" onClick={finishQuiz}>
                View results
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
