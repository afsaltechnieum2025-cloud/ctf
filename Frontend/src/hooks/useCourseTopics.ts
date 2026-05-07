import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchLearningCourseTopics } from '@/api/learning';
import type { CourseTopic } from '@/data/courseTopics';

export function useCourseTopics() {
  const { token } = useAuth();
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTopics([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchLearningCourseTopics(token)
      .then((data) => {
        if (!cancelled) setTopics(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Request failed';
          setError(
            msg === 'Failed to fetch'
              ? `${msg} — start the backend (cd backend && npm run dev). If DevTools shows ERR_CONNECTION_REFUSED to port 5000, nothing is listening there yet.`
              : msg,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { topics, loading, error };
}
