import { Link, useParams } from 'react-router-dom';
import VendorDeepDiveSections from '@/components/course/VendorDeepDiveSections';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseLinkedProductSlugs } from '@/hooks/useCourseLinkedProductSlugs';
import { isProductLinkedToCourses } from '@/data/courseTopics';
import { getProductBySlug } from '@/data/productCatalog';
import { getSalesBrief } from '@/data/productSalesBriefs';
import { ArrowLeft, ExternalLink, MessageCircle, Target } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { slugs: courseLinkedSlugs, loading: courseLinksLoading } = useCourseLinkedProductSlugs();
  const product = slug ? getProductBySlug(slug) : undefined;
  const brief = slug ? getSalesBrief(slug) : undefined;

  const hasProductQuiz = Boolean(
    slug &&
      (courseLinksLoading ? isProductLinkedToCourses(slug) : courseLinkedSlugs.includes(slug)),
  );

  if (!product || !brief) {
    return (
      <DashboardLayout title="Courses" description="">
        <Card className="w-full max-w-full border-border/60 sm:max-w-md">
          <CardHeader>
            <CardTitle>Course not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/courses">Back to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={product.name} description="">
      <div className={hasProductQuiz ? 'pb-24' : undefined}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 pl-0 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/courses">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All courses
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              Vendor site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        </div>

        <div className="min-w-0 w-full space-y-5">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/80 to-card">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">At a glance</p>
              <CardTitle className="text-lg leading-snug text-foreground sm:text-xl">{brief.tagline}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{brief.inPlainEnglish}</p>
            </CardContent>
          </Card>

          {brief.deepDive ? <VendorDeepDiveSections deepDive={brief.deepDive} /> : null}

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle className="text-base">Why it matters to the buyer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {brief.whyItMatters.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle className="text-base">Talk tracks (adapt to your style)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {brief.talkTracks.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-primary/40 bg-muted/20 py-2 pl-4 text-foreground/90 italic"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">If they push back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brief.objections.map(({ question, answer }) => (
                <div key={question} className="rounded-lg border border-border/50 bg-background/40 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{question}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {hasProductQuiz ? (
        <div className="fixed bottom-4 left-3 right-3 z-30 sm:left-5 sm:right-5 lg:left-72 lg:right-8">
          <Button className="w-full gradient-technieum font-semibold text-primary-foreground shadow-lg" asChild>
            <Link to={`/product-mcqs/${product.slug}`}>Practice: Products Quiz for {product.name}</Link>
          </Button>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
