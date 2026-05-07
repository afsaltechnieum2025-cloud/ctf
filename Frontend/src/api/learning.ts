import { API } from '@/utils/api';
import type { CatalogProduct } from '@/data/productCatalog';
import type { CourseTopic } from '@/data/courseTopics';
import type { McqQuestion } from '@/data/productMcqData';
import type { TopicQuizQuestion } from '@/data/courseTopicQuizData';

async function learningFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}/learning${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) detail = String(body.error);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchLearningProducts(token: string): Promise<CatalogProduct[]> {
  return learningFetch<CatalogProduct[]>('/products', token);
}

export function fetchLearningCourseTopics(token: string): Promise<CourseTopic[]> {
  return learningFetch<CourseTopic[]>('/course-topics', token);
}

export type ProductMcqApiResponse = { slug: string; questions: McqQuestion[] };

export function fetchProductMcqs(token: string, productSlug: string): Promise<ProductMcqApiResponse> {
  return learningFetch<ProductMcqApiResponse>(`/product-mcqs/${encodeURIComponent(productSlug)}`, token);
}

export type TopicQuizApiResponse = { slug: string; questions: TopicQuizQuestion[] };

export function fetchTopicQuiz(token: string, topicSlug: string): Promise<TopicQuizApiResponse> {
  return learningFetch<TopicQuizApiResponse>(`/topic-quiz/${encodeURIComponent(topicSlug)}`, token);
}
