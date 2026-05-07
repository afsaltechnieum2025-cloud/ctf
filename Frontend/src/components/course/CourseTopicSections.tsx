import type { CourseTopicSection } from '@/data/courseTopics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  sections: CourseTopicSection[];
};

export default function CourseTopicSections({ sections }: Props) {
  if (!sections.length) return null;

  return (
    <section className="mb-12 space-y-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Topic deep dive</h2>
      <div className="space-y-5">
        {sections.map((sec, idx) => (
          <Card key={`${idx}-${sec.heading}`} className="border-border/60 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold leading-snug sm:text-lg">{sec.heading}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {sec.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
