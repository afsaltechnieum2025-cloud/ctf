import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProductBySlug } from '@/data/productCatalog';
import { getSalesBrief } from '@/data/productSalesBriefs';
import { ArrowLeft, Check, ExternalLink, MessageCircle, Target, Users } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const brief = slug ? getSalesBrief(slug) : undefined;

  if (!product || !brief) {
    return (
      <DashboardLayout title="Products" description="">
        <Card className="w-full max-w-full border-border/60 sm:max-w-md">
          <CardHeader>
            <CardTitle>Product not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={product.name} description="">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5 pl-0 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All products
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a href={product.url} target="_blank" rel="noopener noreferrer">
            Vendor site
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      </div>

      <div className="grid w-full gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/80 to-card">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">In one sentence</p>
              <CardTitle className="text-lg leading-snug text-foreground sm:text-xl">{brief.tagline}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{brief.inPlainEnglish}</p>
            </CardContent>
          </Card>

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

        <div className="space-y-5 lg:col-span-1">
          <Card className="border-border/60 lg:sticky lg:top-24">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Users className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle className="text-base">Who usually cares</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {brief.whoBuysThis.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">How to position it</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {brief.differentiators.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Button className="w-full gradient-technieum font-semibold text-primary-foreground" asChild>
            <Link to={`/product-mcqs/${product.slug}`}>Practice: MCQ for {product.name}</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
