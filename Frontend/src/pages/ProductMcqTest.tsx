import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { getProductBySlug } from '@/data/productCatalog';
import { getMcqSetForSlug, MCQ_QUESTION_STEMS } from '@/data/productMcqData';
import { ArrowLeft, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOTAL = MCQ_QUESTION_STEMS.length;

const heroEnter = {
  hidden: { opacity: 0, y: 14 },
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 30 },
  }),
};

export default function ProductMcqTest() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const questions = slug ? getMcqSetForSlug(slug) : undefined;
  const reduceMotion = useReducedMotion() ?? false;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(TOTAL).fill(null));
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  useEffect(() => {
    setStep(0);
    setAnswers(Array(TOTAL).fill(null));
    setPhase('quiz');
  }, [slug]);

  const invalid = !product || !questions || questions.length !== TOTAL;

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

  const sharedKeyframes = (
    <style>{`
      @keyframes mcq-orbit {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .mcq-orbit-slow { animation: mcq-orbit 28s linear infinite; }
      @keyframes mcq-pulse-line {
        0%, 100% { opacity: 0.35; transform: scaleX(0.92); }
        50% { opacity: 0.85; transform: scaleX(1); }
      }
      .mcq-pulse-line { animation: mcq-pulse-line 3.2s ease-in-out infinite; }
    `}</style>
  );

  if (invalid) {
    return (
      <DashboardLayout title="Product MCQs" description="">
        {sharedKeyframes}
        <motion.div
          custom={reduceMotion}
          variants={heroEnter}
          initial="hidden"
          animate="show"
          className="relative w-full max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card/40 to-background p-[1px] shadow-lg"
        >
          <div className="relative rounded-2xl bg-gradient-to-br from-zinc-950/90 via-card to-zinc-950/95 px-6 py-8 backdrop-blur-sm">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(249,115,22,0.12),transparent)]"
              aria-hidden
            />
            <h2 className="relative text-xl font-bold text-foreground">Quiz not found</h2>
            <p className="relative mt-2 text-sm text-muted-foreground">
              This product does not have an MCQ set yet.
            </p>
            <Button className="relative mt-6" variant="outline" asChild>
              <Link to="/product-mcqs">Back to Product MCQs</Link>
            </Button>
          </div>
        </motion.div>
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

  if (phase === 'results') {
    return (
      <DashboardLayout title={`${product.name} — Results`} description="">
        {sharedKeyframes}
        <div className="relative w-full space-y-8 pb-4">
          <motion.div
            custom={reduceMotion}
            variants={heroEnter}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card/40 to-background px-6 py-8 sm:px-8 sm:py-9"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Results
              </div>
              <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                <div className="mcq-orbit-slow absolute inset-0 rounded-full border border-dashed border-primary/25" aria-hidden />
                <div className="relative rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-center shadow-md backdrop-blur-sm">
                  <p className="text-lg font-black tabular-nums text-gradient sm:text-xl">
                    {score.correct}/{TOTAL}
                  </p>
                </div>
              </div>
            </div>
            <h2 className="relative mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-gradient">Scoreboard</span>
            </h2>
            <p className="relative mt-2 text-sm text-muted-foreground">
              {score.correct} correct · {score.wrong} incorrect or unanswered
            </p>
            <div
              className="mcq-pulse-line relative mt-6 h-px w-full rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              aria-hidden
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 400, damping: 32, delay: 0.06 }
            }
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/30 p-[1px] shadow-lg"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950/90 via-card to-zinc-950/95 px-5 py-6 backdrop-blur-sm sm:px-6 sm:py-7">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.14),transparent)] opacity-70"
                aria-hidden
              />
              <div className="relative grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/[0.12] px-4 py-4 text-center shadow-[0_0_24px_-8px_rgba(16,185,129,0.25)]">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Correct
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    {score.correct}
                  </p>
                </div>
                <div className="rounded-xl border border-destructive/35 bg-destructive/[0.12] px-4 py-4 text-center shadow-[0_0_24px_-8px_rgba(239,68,68,0.2)]">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
                    <XCircle className="h-4 w-4" aria-hidden />
                    Wrong / skip
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-destructive">{score.wrong}</p>
                </div>
              </div>

              <div className="relative mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary/30 bg-background/40 hover:bg-primary/10"
                  onClick={retake}
                >
                  Retake quiz
                </Button>
                <Button className="gradient-technieum text-primary-foreground shadow-md" asChild>
                  <Link to="/product-mcqs">Another product</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <Button variant="ghost" size="sm" className="gap-1.5 pl-0 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/product-mcqs">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All products
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isLast = step === TOTAL - 1;
  const selected = answers[step];

  return (
    <DashboardLayout title={`${product.name} — MCQ`} description={`Question ${step + 1} of ${TOTAL}`}>
      {sharedKeyframes}
      <div className="relative w-full space-y-8 pb-4">
        <motion.div
          custom={reduceMotion}
          variants={heroEnter}
          initial="hidden"
          animate="show"
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card/40 to-background px-6 py-7 sm:px-8 sm:py-8"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Live quiz
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/90">
                {product.name}
              </p>
              <p className="text-sm font-semibold text-primary">
                Question {step + 1} <span className="text-muted-foreground">/</span> {TOTAL}
              </p>
            </div>
            <div className="relative hidden h-24 w-24 shrink-0 sm:flex sm:items-center sm:justify-center">
              <div className="mcq-orbit-slow absolute inset-0 rounded-full border border-dashed border-primary/25" aria-hidden />
              <div className="relative rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-center text-xs font-bold tabular-nums text-gradient shadow-md backdrop-blur-sm">
                {step + 1}
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  of {TOTAL}
                </span>
              </div>
            </div>
          </div>
          <div
            className="mcq-pulse-line relative mt-6 h-px w-full rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            aria-hidden
          />
        </motion.div>

        <Button variant="ghost" size="sm" className="gap-1.5 pl-0 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/product-mcqs">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All products
          </Link>
        </Button>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/30 p-[1px] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950/90 via-card to-zinc-950/95 backdrop-blur-sm">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-25%,rgba(249,115,22,0.16),transparent)]"
              aria-hidden
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28, filter: 'blur(4px)' }
                }
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -22, filter: 'blur(3px)' }}
                transition={
                  reduceMotion ? { duration: 0.12 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                }
                className="relative px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7"
              >
                <h2 className="text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">{stem}</h2>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  Tap an option, then Prev / Next — Done on the last question.
                </p>

                <fieldset className="mt-6 space-y-2.5">
                  <legend className="sr-only">{stem}</legend>
                  {current.options.map((label, i) => {
                    const id = `mcq-${slug}-${step}-${i}`;
                    const checked = selected === i;
                    return (
                      <motion.label
                        key={id}
                        htmlFor={id}
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { delay: 0.04 + i * 0.045, type: 'spring', stiffness: 440, damping: 28 }
                        }
                        whileHover={reduceMotion ? {} : { scale: 1.01 }}
                        whileTap={reduceMotion ? {} : { scale: 0.995 }}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3.5 text-sm leading-snug transition-colors duration-200 sm:px-4 sm:py-4',
                          checked
                            ? 'border-primary/50 bg-primary/15 text-foreground shadow-[0_0_28px_-8px_rgba(249,115,22,0.35)]'
                            : 'border-white/[0.08] bg-background/25 hover:border-primary/30 hover:bg-muted/20',
                        )}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={`mcq-${slug}-${step}`}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                          checked={checked}
                          onChange={() => setChoice(i)}
                        />
                        <span>{label}</span>
                      </motion.label>
                    );
                  })}
                </fieldset>

                <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[88px] border-primary/25 bg-background/40 hover:bg-primary/10"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Prev
                  </Button>
                  {!isLast ? (
                    <Button
                      type="button"
                      className="min-w-[88px] gradient-technieum font-semibold text-primary-foreground shadow-md"
                      onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="min-w-[88px] gradient-technieum font-semibold text-primary-foreground shadow-md"
                      onClick={goDone}
                    >
                      Done
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
