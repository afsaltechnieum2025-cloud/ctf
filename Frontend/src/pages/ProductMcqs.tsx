import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { PRODUCTS } from '@/data/productCatalog';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const MotionLink = motion(Link);

const container = {
  hidden: { opacity: 0 },
  show: (reduce: boolean) => ({
    opacity: 1,
    transition: {
      staggerChildren: reduce ? 0 : 0.07,
      delayChildren: reduce ? 0 : 0.12,
      duration: reduce ? 0.2 : 0.4,
    },
  }),
};

const tile = {
  hidden: (reduce: boolean) =>
    reduce
      ? { opacity: 0 }
      : { opacity: 0, y: 28, scale: 0.94, rotateX: 8 },
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: reduce
      ? { duration: 0.2 }
      : { type: 'spring', stiffness: 420, damping: 32, mass: 0.85 },
  }),
};

const heroLine = {
  hidden: { opacity: 0, y: 16 },
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 30, delay: 0.02 },
  }),
};

export default function ProductMcqs() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <DashboardLayout
      title="Product MCQs"
      description="Five rapid-fire questions per vendor—lock in your product IQ."
    >
      <style>{`
        @keyframes mcq-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .mcq-orbit-slow {
          animation: mcq-orbit 28s linear infinite;
        }
        @keyframes mcq-pulse-line {
          0%, 100% { opacity: 0.35; transform: scaleX(0.92); }
          50% { opacity: 0.85; transform: scaleX(1); }
        }
        .mcq-pulse-line {
          animation: mcq-pulse-line 3.2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative w-full space-y-10 pb-4">
        <motion.div
          custom={reduceMotion}
          variants={heroLine}
          initial="hidden"
          animate="show"
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card/40 to-background px-6 py-8 sm:px-10 sm:py-10"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-none flex-1 space-y-3 sm:pr-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.15, type: 'spring', stiffness: 400, damping: 22 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Challenge mode
              </motion.div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Choose a product.{' '}
                <span className="text-gradient">Own the quiz.</span>
              </h2>
            </div>
            <div className="hidden shrink-0 sm:block">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div
                  className="mcq-orbit-slow absolute inset-0 rounded-full border border-dashed border-primary/25"
                  aria-hidden
                />
                <div className="relative rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-2xl font-black tabular-nums text-gradient">5</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qs each</p>
                </div>
              </div>
            </div>
          </div>
          <div
            className="mcq-pulse-line relative mt-8 h-px w-full origin-left rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            aria-hidden
          />
        </motion.div>

        <motion.div
          custom={reduceMotion}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {PRODUCTS.map((item) => (
            <MotionLink
              key={item.slug}
              to={`/product-mcqs/${item.slug}`}
              custom={reduceMotion}
              variants={tile}
              whileHover={
                reduceMotion
                  ? {}
                  : {
                      y: -6,
                      scale: 1.02,
                      transition: { type: 'spring', stiffness: 520, damping: 22 },
                    }
              }
              whileTap={reduceMotion ? {} : { scale: 0.985 }}
              className={cn(
                'group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-card/30 p-[1px] shadow-lg outline-none',
                'transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'hover:border-primary/30 hover:shadow-[0_24px_48px_-12px_rgba(249,115,22,0.22)]',
              )}
            >
              <span className="sr-only">Start five-question MCQ for {item.name}</span>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950/90 via-card to-zinc-950/95 px-6 pb-6 pt-7 backdrop-blur-sm">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.18),transparent)] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-1"
                  aria-hidden
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/90">Vendor</p>
                    <h3 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                      <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent transition-all duration-300 group-hover:from-white group-hover:to-zinc-300">
                        {item.name}
                      </span>
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold tabular-nums text-primary">
                    ×5
                  </span>
                </div>

                <div className="relative mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
                  <span className="text-sm font-semibold tracking-wide text-primary">Start MCQ</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.35)]">
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            </MotionLink>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
