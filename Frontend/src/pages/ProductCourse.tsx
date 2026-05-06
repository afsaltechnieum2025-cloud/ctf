import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { PRODUCTS } from '@/data/productCatalog';

export default function ProductCourse() {
  return (
    <DashboardLayout title="Products">
      <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {PRODUCTS.map((item) => (
          <Link
            key={item.slug}
            to={`/products/${item.slug}`}
            aria-label={`View ${item.name}`}
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card className="group flex h-full flex-col overflow-hidden border-border/60 bg-card/40 transition-all hover:border-primary/35 hover:bg-card/60 hover:shadow-md">
              <div className="relative flex aspect-[16/10] min-h-[140px] w-full shrink-0 items-center justify-center border-b border-border/50 bg-gradient-to-b from-secondary/40 to-muted/20 sm:min-h-[160px]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/40">
                      <ImageIcon className="h-5 w-5" aria-hidden />
                    </div>
                    <p className="text-xs font-medium">Logo or product image</p>
                  </div>
                )}
              </div>

              <CardHeader className="space-y-2 pb-4 pt-4">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {item.name}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
