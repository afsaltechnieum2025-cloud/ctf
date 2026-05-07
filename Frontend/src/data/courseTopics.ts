/**
 * Course topics (e.g. RASP) group vendors from the product catalog.
 * Topic pages link to existing product detail routes: /courses/:slug
 */

export type CourseTopicSection = {
  heading: string;
  paragraphs: string[];
};

export type CourseTopic = {
  slug: string;
  title: string;
  tagline: string;
  /** Shown on /courses topic cards */
  summary: string;
  /** Keys from productCatalog (PRODUCTS[].slug) */
  relatedProductSlugs: string[];
  sections: CourseTopicSection[];
};

export const COURSE_TOPICS: CourseTopic[] = [
  {
    slug: 'rasp',
    title: 'RASP — Runtime Application Self-Protection',
    tagline: 'Defense that lives inside the running application',
    summary:
      'Learn what Runtime Application Self-Protection is, how it differs from perimeter tools, and which vendors in our catalog align with runtime and in-app defense.',
    relatedProductSlugs: ['protectt-ai'],
    sections: [
      {
        heading: 'What is RASP?',
        paragraphs: [
          'Runtime Application Self-Protection (RASP) is a security approach where protection logic is embedded in or tightly bound to the application while it runs. Instead of relying only on external devices such as web application firewalls (WAFs) or generic network filters, RASP observes the application’s own behavior—API calls, data flows, integrity checks—and can block or alert when execution diverges from policy.',
          'The term is most often used for web and API workloads, but the same idea applies to mobile: instrumentation inside the app (or a shielded binary) that can detect tampering, hooking, cloned builds, or abuse at the moment users interact with the real binary.',
        ],
      },
      {
        heading: 'Why teams adopt RASP',
        paragraphs: [
          'Perimeter controls cannot see everything that happens after traffic reaches the app. Misconfigurations, business-logic flaws, and supply-chain issues may be invisible to a WAF. RASP narrows the gap by operating with application context: it knows which database queries, file paths, or sensitive operations are expected for a given request or session.',
          'RASP is especially useful when releases are frequent, when APIs are exposed directly to clients, or when mobile apps face reverse engineering and fraud. It complements secure SDLC activities (SAST, DAST, dependency scanning) rather than replacing them.',
        ],
      },
      {
        heading: 'How RASP typically works',
        paragraphs: [
          'Common deployment patterns include language runtimes or agents that instrument bytecode or processes, SDKs linked into mobile binaries, or sidecar components that receive telemetry from instrumented apps. Policies may be defined centrally (allowlists, sensitivity labels, threat signatures) and pushed to the runtime.',
          'Detection can combine signatures, heuristics, and baselines of “normal” app behavior. Response actions range from logging and alerting to blocking specific calls, terminating sessions, or degrading functionality when integrity checks fail.',
        ],
      },
      {
        heading: 'RASP vs WAF, SAST, and pentesting',
        paragraphs: [
          'A WAF inspects HTTP traffic at the edge; it does not inherently understand your business rules or every internal call. SAST and DAST find issues before or in test environments; they do not observe every attack against production traffic. Pentests are point-in-time. RASP adds a continuous, in-process view of what the application actually does when users and attackers interact with it.',
          'In practice, enterprises combine these layers: shift-left testing to reduce defects, WAF/API gateway for coarse filtering, and RASP or runtime integrity for high-value apps or regulated data paths.',
        ],
      },
      {
        heading: 'What to look for when evaluating RASP',
        paragraphs: [
          'Consider coverage (languages, frameworks, mobile vs server), performance overhead, how policies are managed at scale, integration with SIEM/SOAR, and whether the vendor supports your compliance and data-residency requirements.',
          'For mobile, also evaluate anti-tamper depth, release pipeline integration (build-time vs runtime configuration), and how findings are presented to developers versus fraud or SOC teams.',
        ],
      },
    ],
  },
];

export function getCourseTopicBySlug(slug: string): CourseTopic | undefined {
  return COURSE_TOPICS.find((t) => t.slug === slug);
}

/** Unique product slugs linked from any course topic (scope for Products Quiz). */
export function getCourseLinkedProductSlugs(): readonly string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const topic of COURSE_TOPICS) {
    for (const slug of topic.relatedProductSlugs) {
      if (!seen.has(slug)) {
        seen.add(slug);
        ordered.push(slug);
      }
    }
  }
  return ordered;
}

export function isProductLinkedToCourses(slug: string): boolean {
  return getCourseLinkedProductSlugs().includes(slug);
}
