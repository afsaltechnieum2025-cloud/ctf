import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCourseLinkedProductSlugs } from '@/data/courseTopics';
import { getProductBySlug } from '@/data/productCatalog';
import type { CatalogProduct } from '@/data/productCatalog';
import { ImageIcon } from 'lucide-react';

export default function ProductMcqs() {
  const quizProducts = useMemo(() => {
    return getCourseLinkedProductSlugs()
      .map((slug) => getProductBySlug(slug))
      .filter((p): p is CatalogProduct => Boolean(p));
  }, []);

  return (
    <DashboardLayout title="Products Quiz">
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Five multiple-choice questions per vendor, aligned with the same story as the vendor course pages.
        Only vendors linked from your course topics are listed here.
      </p>

      {quizProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
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
      )}
    </DashboardLayout>
  );
}
