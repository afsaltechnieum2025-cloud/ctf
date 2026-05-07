import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, ArrowLeft } from 'lucide-react';
import { getCourseTopicBySlug } from '@/data/courseTopics';
import { getProductBySlug, PRODUCTS } from '@/data/productCatalog';

export default function CourseTopicDetail() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const topic = topicSlug ? getCourseTopicBySlug(topicSlug) : undefined;

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

  const relatedProducts = topic.relatedProductSlugs
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <DashboardLayout title={topic.title}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All topics
          </Link>
        </Button>
      </div>

      <p className="mb-8 max-w-3xl text-base text-muted-foreground">{topic.tagline}</p>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
          Vendors in this topic
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Products from our catalog that emphasize runtime or in-app protection aligned
          with this topic. Select a card to open the full sales brief and Products Quiz.
        </p>
        {relatedProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No linked products yet. Browse all vendors on the{' '}
            <Link to="/dashboard" className="text-primary underline-offset-4 hover:underline">
              dashboard
            </Link>
            .
          </p>
        ) : (
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <Link
                key={item.slug}
                to={`/courses/${item.slug}`}
                aria-label={`Open vendor: ${item.name}`}
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
      </section>

      <article className="max-w-3xl space-y-10 border-t border-border/60 pt-10">
        {topic.sections.map((sec) => (
          <section key={sec.heading}>
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
              {sec.heading}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {sec.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </article>

      <p className="mt-12 text-xs text-muted-foreground">
        Full vendor list ({PRODUCTS.length}): use the dashboard product grid or open each
        from{' '}
        <Link to="/courses" className="text-primary underline-offset-4 hover:underline">
          Courses
        </Link>
        .
      </p>
    </DashboardLayout>
  );
}
