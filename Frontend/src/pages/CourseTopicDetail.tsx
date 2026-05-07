import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import RaspFoundationContent from '@/components/course/RaspFoundationContent';
import CourseTopicSections from '@/components/course/CourseTopicSections';
import { useCourseTopicBySlug } from '@/hooks/useCourseTopicBySlug';
import { useLearningProducts } from '@/hooks/useLearningProducts';
import { useTopicQuiz } from '@/hooks/useTopicQuiz';
import { getProductBySlug } from '@/data/productCatalog';
import type { CatalogProduct } from '@/data/productCatalog';
import { cn } from '@/lib/utils';

function resolveRelatedProducts(
  slugs: string[],
  apiProducts: CatalogProduct[]
): CatalogProduct[] {
  return slugs
    .map((slug) => apiProducts.find((p) => p.slug === slug) ?? getProductBySlug(slug))
    .filter((p): p is CatalogProduct => Boolean(p));
}

export default function CourseTopicDetail() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const { topic, loading: topicLoading, error: topicError } = useCourseTopicBySlug(topicSlug);
  const { products: apiProducts, loading: productsLoading } = useLearningProducts();
  const { questions: quizQuestions, loading: quizLoading } = useTopicQuiz(topic?.slug);

  const relatedProducts = topic
    ? resolveRelatedProducts(topic.relatedProductSlugs, apiProducts)
    : [];
  const hasTopicQuiz = !quizLoading && quizQuestions.length > 0;

  const vendorScrollRef = useRef<HTMLDivElement>(null);
  const [vendorScrollState, setVendorScrollState] = useState({ canPrev: false, canNext: true });

  const syncVendorScrollArrows = useCallback(() => {
    const el = vendorScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const epsilon = 4;
    setVendorScrollState({
      canPrev: scrollLeft > epsilon,
      canNext: scrollLeft < maxScroll - epsilon,
    });
  }, []);

  useEffect(() => {
    syncVendorScrollArrows();
    const el = vendorScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncVendorScrollArrows, { passive: true });
    const ro = new ResizeObserver(syncVendorScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncVendorScrollArrows);
      ro.disconnect();
    };
  }, [relatedProducts.length, syncVendorScrollArrows]);

  const scrollVendors = (direction: -1 | 1) => {
    const el = vendorScrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.75, 240);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (topicLoading && !topic) {
    return (
      <DashboardLayout title="Courses">
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Loading topic…
        </p>
      </DashboardLayout>
    );
  }

  if (topicError) {
    return (
      <DashboardLayout title="Courses">
        <p className="text-sm text-destructive" role="alert">
          {topicError}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/courses">Back to courses</Link>
        </Button>
      </DashboardLayout>
    );
  }

  if (!topic) {
    return (
      <DashboardLayout title="Topic not found">
        <p className="text-muted-foreground">This course topic does not exist.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/courses">Back to courses</Link>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={topic.title}>
      <div className={hasTopicQuiz ? 'pb-24' : undefined}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
            <Link to="/courses">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All topics
            </Link>
          </Button>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Vendors in this topic</h2>
          {productsLoading && relatedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading vendors…</p>
          ) : relatedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No linked products yet. Browse all vendors on the{' '}
              <Link to="/dashboard" className="text-primary underline-offset-4 hover:underline">
                dashboard
              </Link>
              .
            </p>
          ) : (
            <div className="relative">
              {relatedProducts.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    disabled={!vendorScrollState.canPrev}
                    className={cn(
                      'absolute left-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm',
                      'disabled:pointer-events-none disabled:opacity-35',
                    )}
                    aria-label="Scroll vendors left"
                    onClick={() => scrollVendors(-1)}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    disabled={!vendorScrollState.canNext}
                    className={cn(
                      'absolute right-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm',
                      'disabled:pointer-events-none disabled:opacity-35',
                    )}
                    aria-label="Scroll vendors right"
                    onClick={() => scrollVendors(1)}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </Button>
                </>
              ) : null}
              <div
                ref={vendorScrollRef}
                className={cn(
                  'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 pt-0.5',
                  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                  relatedProducts.length > 1 ? 'px-11 sm:px-12' : undefined,
                )}
              >
                {relatedProducts.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/courses/${item.slug}`}
                    aria-label={`Open vendor: ${item.name}`}
                    className="block w-[min(100%,280px)] shrink-0 snap-start rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-[300px]"
                  >
                    <Card className="group flex h-full min-h-[220px] flex-col overflow-hidden border-border/60 bg-card/40 transition-all hover:border-primary/35 hover:bg-card/60 hover:shadow-md">
                      <div className="relative flex aspect-[16/10] min-h-[120px] w-full shrink-0 items-center justify-center border-b border-border/50 bg-gradient-to-b from-secondary/40 to-muted/20">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain p-4"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-center text-muted-foreground">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/40">
                              <ImageIcon className="h-4 w-4" aria-hidden />
                            </div>
                          </div>
                        )}
                      </div>
                      <CardHeader className="space-y-1 pb-3 pt-3">
                        <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                        <CardDescription className="text-xs leading-relaxed line-clamp-3">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {topic.tagline ? (
          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{topic.tagline}</p>
        ) : null}

        {topic.slug === 'rasp' ? (
          <RaspFoundationContent />
        ) : topic.sections && topic.sections.length > 0 ? (
          <CourseTopicSections sections={topic.sections} />
        ) : null}

      </div>

      {hasTopicQuiz ? (
        <div className="fixed bottom-4 left-3 right-3 z-30 sm:left-5 sm:right-5 lg:left-72 lg:right-8">
          <Button className="w-full gradient-technieum font-semibold text-primary-foreground shadow-lg" asChild>
            <Link to={`/courses/topics/${topic.slug}/quiz`}>
              Practice: Topic Quiz for {topic.slug.toUpperCase()}
            </Link>
          </Button>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
