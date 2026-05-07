import { useMemo } from 'react';
import { useCourseTopics } from '@/hooks/useCourseTopics';
import type { CourseTopic } from '@/data/courseTopics';

export function useCourseTopicBySlug(slug: string | undefined) {
  const { topics, loading, error } = useCourseTopics();

  const topic = useMemo((): CourseTopic | undefined => {
    if (!slug) return undefined;
    return topics.find((t) => t.slug === slug);
  }, [topics, slug]);

  return { topic, loading, error, topics };
}
