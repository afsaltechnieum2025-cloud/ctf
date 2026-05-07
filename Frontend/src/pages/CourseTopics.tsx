import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { useCourseTopics } from '@/hooks/useCourseTopics';

export default function CourseTopics() {
  const { topics, loading, error } = useCourseTopics();

  return (
    <DashboardLayout title="Courses">
      {error ? (
        <p className="mb-6 max-w-2xl text-sm text-destructive" role="alert">
          Failed to load topics: {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading topics">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="flex h-full min-h-[220px] flex-col overflow-hidden border-border/60 bg-card/40 animate-pulse"
            >
              <div className="aspect-[16/10] min-h-[140px] bg-muted/50 sm:min-h-[160px]" />
              <CardHeader className="space-y-3 pb-4 pt-4">
                <div className="h-5 w-[85%] rounded bg-muted/60" />
                <div className="h-4 w-full rounded bg-muted/40" />
                <div className="h-4 w-[92%] rounded bg-muted/40" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No course topics yet. Add rows in the database (see <code className="rounded bg-muted px-1 py-0.5 text-xs">backend/sql/seed_course_rasp.sql</code>) or sign in to load topics.
        </p>
      ) : (
        <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
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
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {topic.summary || topic.tagline}
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
