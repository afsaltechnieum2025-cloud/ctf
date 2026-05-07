import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { COURSE_TOPICS } from '@/data/courseTopics';

export default function CourseTopics() {
  return (
    <DashboardLayout title="Courses">
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Pick a topic to read the deep dive, then open vendor pages from the catalog
        that map to that topic.
      </p>
      <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COURSE_TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            to={`/courses/topics/${topic.slug}`}
            aria-label={`Open topic: ${topic.title}`}
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card className="group flex h-full flex-col overflow-hidden border-border/60 bg-card/40 transition-all hover:border-primary/35 hover:bg-card/60 hover:shadow-md">
              <div className="relative flex aspect-[16/10] min-h-[140px] w-full shrink-0 items-center justify-center border-b border-border/50 bg-gradient-to-b from-primary/15 to-muted/20 sm:min-h-[160px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <BookOpen className="h-8 w-8" aria-hidden />
                </div>
              </div>
              <CardHeader className="space-y-2 pb-4 pt-4">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {topic.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {topic.summary}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
