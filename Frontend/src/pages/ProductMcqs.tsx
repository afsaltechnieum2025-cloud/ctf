import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseLinkedProductSlugs } from '@/hooks/useCourseLinkedProductSlugs';
import { useLearningProducts } from '@/hooks/useLearningProducts';
import { getCourseLinkedProductSlugs } from '@/data/courseTopics';
import { getProductBySlug } from '@/data/productCatalog';
import type { CatalogProduct } from '@/data/productCatalog';
import { ImageIcon } from 'lucide-react';

export default function ProductMcqs() {
  const { slugs, loading: topicsLoading, error } = useCourseLinkedProductSlugs();
  const { products, loading: productsLoading } = useLearningProducts();

  const displaySlugs = useMemo(
    () => (topicsLoading ? [...getCourseLinkedProductSlugs()] : slugs),
    [topicsLoading, slugs],
  );

  const quizProducts = useMemo(() => {
    return displaySlugs
      .map((slug) => products.find((p) => p.slug === slug) ?? getProductBySlug(slug))
      .filter((p): p is CatalogProduct => Boolean(p));
  }, [displaySlugs, products]);

  return (
    <DashboardLayout title="Products Quiz">
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {topicsLoading || productsLoading ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Loading…
        </p>
      ) : quizProducts.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No vendors are linked from Courses yet. Add products to a topic under{' '}
          <Link to="/courses" className="font-medium text-primary underline-offset-4 hover:underline">
            Courses
          </Link>
          .
        </p>
      ) : (
        <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizProducts.map((item) => (
            <Link
              key={item.slug}
              to={`/product-mcqs/${item.slug}`}
              aria-label={`Start Products Quiz for ${item.name}`}
              className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="group flex h-full flex-col overflow-hidden border-border/60 bg-card/40 transition-all hover:border-primary/35 hover:bg-card/60 hover:shadow-md">
                <div className="relative flex aspect-[16/10] min-h-[140px] w-full shrink-0 items-center justify-center border-b border-border/50 bg-gradient-to-b from-primary/15 to-muted/20 sm:min-h-[160px]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-center text-muted-foreground">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                        <ImageIcon className="h-8 w-8" aria-hidden />
                      </div>
                    </div>
                  )}
                </div>
                <CardHeader className="space-y-2 pb-4 pt-4">
                  <CardTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
