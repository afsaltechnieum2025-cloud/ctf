import { useMemo } from 'react';
import { useCourseTopics } from '@/hooks/useCourseTopics';

/** Product slugs linked from any course topic (same order as first seen in topic list). */
export function useCourseLinkedProductSlugs() {
  const { topics, loading, error } = useCourseTopics();

  const slugs = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const topic of topics) {
      for (const s of topic.relatedProductSlugs) {
        if (!seen.has(s)) {
          seen.add(s);
          ordered.push(s);
        }
      }
    }
    return ordered;
  }, [topics]);

  return { slugs, loading, error };
}
