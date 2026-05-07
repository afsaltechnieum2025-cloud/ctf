export type CatalogProduct = {
  /** URL segment for course detail + Products Quiz routes, e.g. `/courses/appknox`, `/product-mcqs/appknox` */
  slug: string;
  name: string;
  /** Official site (reference; not shown in the Products grid UI). */
  url: string;
  /** Optional: e.g. `/courses/your-file.png` under `public/courses/` (or legacy `public/products/`). */
  image?: string;
  description: string;
};

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: 'protectt-ai',
    name: 'Protectt.ai',
    url: 'https://www.protectt.ai/',
    description:
      'Protectt.ai focuses on protecting live applications—especially on mobile—where attackers tamper with binaries, hook APIs, or abuse runtime behavior. Teams use it to harden releases, detect cloning and fraud patterns, and gather telemetry when apps run in hostile environments. It complements traditional scanning by addressing what happens after the app ships to real users.',
  },
  {
    slug: 'appknox',
    name: 'Appknox',
    url: 'https://www.appknox.com/',
    description:
      'Appknox is built for enterprise mobile application security testing at scale. It performs binary-based analysis (covering static, dynamic, and API-oriented checks), supports expert-led penetration testing, and helps teams track third-party and first-party components through SBOM-style visibility. Store-monitoring capabilities also help organizations watch for drift, impersonation, and policy issues across published builds.',
  },
  {
    slug: 'cybereason',
    name: 'Cybereason',
    url: 'https://www.cybereason.com/',
    description:
      'Cybereason delivers an operation-centric defense platform spanning NGAV, EDR, and broader XDR use cases. Instead of drowning analysts in unrelated alerts, it correlates activity into “malicious operations” so responders see the full attack story—from initial access through lateral movement. Managed offerings extend coverage for teams that need 24×7 monitoring and faster containment.',
  },
  {
    slug: 'cequence',
    name: 'Cequence',
    url: 'https://www.cequence.ai/',
    description:
      'Cequence secures modern application surfaces where APIs, automation, and AI agents expand the attack plane. Capabilities typically include API discovery and posture management, bot and abuse detection, WAAP-style protections, and controls for agentic AI traffic. The goal is consistent policy and visibility across gateways, microservices, and partner-facing endpoints—not just perimeter WAF rules.',
  },
  {
    slug: 'fortra',
    name: 'Fortra',
    url: 'https://www.fortra.com/',
    description:
      'Fortra is a broad cybersecurity and automation vendor whose portfolio spans data protection, secure file transfer, infrastructure hardening, and many adjacent disciplines. Enterprises often engage Fortra when they need integrated tooling under one vendor relationship, standardized reporting for auditors, and repeatable workflows across on‑prem, cloud, and hybrid estates.',
  },
  {
    slug: 'lightbeam',
    name: 'Lightbeam',
    url: 'https://www.lightbeam.ai/',
    description:
      'Lightbeam emphasizes identity-centric data security posture management (DSPM): discover sensitive structured and unstructured data, map it to people and roles, and prioritize remediation. It supports access governance, privacy operations (such as scaling data-subject workflows), and ransomware-oriented use cases by reducing overexposed datasets and improving classification grounded in business context.',
  },
];

export const PRODUCT_COUNT = PRODUCTS.length;

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
