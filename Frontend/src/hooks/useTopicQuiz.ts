import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTopicQuiz } from '@/api/learning';
import type { TopicQuizQuestion } from '@/data/courseTopicQuizData';

export function useTopicQuiz(topicSlug: string | undefined) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<TopicQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !topicSlug) {
      setQuestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTopicQuiz(token, topicSlug)
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.questions) ? res.questions : [];
          setQuestions(
            list.map((q) => ({
              question: q.question,
              options: [
                q.options[0] ?? '',
                q.options[1] ?? '',
                q.options[2] ?? '',
                q.options[3] ?? '',
              ] as [string, string, string, string],
              correctIndex: q.correctIndex,
            }))
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setQuestions([]);
          setError(err instanceof Error ? err.message : 'Request failed');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, topicSlug]);

  return { questions, loading, error };
}
