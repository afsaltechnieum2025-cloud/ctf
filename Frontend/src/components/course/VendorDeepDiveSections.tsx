import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { VendorDeepDive } from '@/data/vendorDeepDives';
import {
  BookOpen,
  Building2,
  ClipboardList,
  Gauge,
  Layers,
  Link2,
  Scale,
  Shield,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';

type Props = { deepDive: VendorDeepDive };

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-foreground">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
      </span>
      <h3 className="text-base font-semibold tracking-tight">{children}</h3>
    </div>
  );
}

export default function VendorDeepDiveSections({ deepDive }: Props) {
  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <SectionTitle icon={Building2}>Company at a glance</SectionTitle>
          <p className="mt-1 pl-10 text-xs leading-relaxed text-muted-foreground">{deepDive.sourceDoc}</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-1">
            {deepDive.snapshot.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4 sm:py-2"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-foreground/90">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <SectionTitle icon={Layers}>Product architecture</SectionTitle>
          <p className="pl-10 text-xs text-muted-foreground">How the pieces fit together</p>
        </CardHeader>
        <CardContent>
          <p className="pl-10 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{deepDive.architecture}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <SectionTitle icon={BookOpen}>Modules explained</SectionTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deepDive.modules.map((m) => (
            <div
              key={m.name}
              className="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-card to-muted/[0.12]"
            >
              <div className="border-b border-border/40 bg-primary/[0.07] px-4 py-2.5">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
              </div>
              <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-border/50">
                <div className="p-4">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    What it does (technical)
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">{m.technical}</p>
                </div>
                <div className="border-t border-border/50 p-4 sm:border-t-0">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    In plain English
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{m.plainEnglish}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <SectionTitle icon={Sparkles}>Key features worth selling</SectionTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground sm:columns-1">
            {deepDive.keyFeatures.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <SectionTitle icon={Link2}>How it integrates</SectionTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{deepDive.integration}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-500/15 bg-emerald-500/[0.04] lg:min-h-[280px]">
          <CardHeader className="pb-2">
            <SectionTitle icon={Target}>Strengths to position on</SectionTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {deepDive.strengths.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-amber-500/15 bg-amber-500/[0.04] lg:min-h-[280px]">
          <CardHeader className="pb-2">
            <SectionTitle icon={TriangleAlert}>Limitations to acknowledge</SectionTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {deepDive.limitations.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <SectionTitle icon={Scale}>Compliance and certifications</SectionTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {deepDive.compliance.map((line) => (
                <li key={line} className="flex gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <SectionTitle icon={Building2}>Typical customer profile</SectionTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {deepDive.typicalCustomers.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
