import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductMcqs } from '@/api/learning';
import type { McqQuestion } from '@/data/productMcqData';

function normalizeQuestion(q: McqQuestion): McqQuestion {
  const raw = Array.isArray(q.options) ? [...q.options] : [];
  const four = [raw[0] ?? '', raw[1] ?? '', raw[2] ?? '', raw[3] ?? ''] as [string, string, string, string];
  let ci = Number(q.correctIndex);
  if (!Number.isFinite(ci)) ci = 0;
  ci = Math.max(0, Math.min(3, Math.floor(ci)));
  return {
    question: q.question,
    options: four,
    correctIndex: ci,
  };
}

export function useProductMcqQuiz(productSlug: string | undefined) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !productSlug) {
      setQuestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProductMcqs(token, productSlug)
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.questions) ? res.questions : [];
          setQuestions(list.map((q) => normalizeQuestion(q)));
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
  }, [token, productSlug]);

  return { questions, loading, error };
}
