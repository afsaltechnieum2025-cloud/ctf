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
    slug: 'guardsquare',
    name: 'Guardsquare',
    url: 'https://www.guardsquare.com/',
    description:
      'Guardsquare is best known for mobile app protection and hardening: DexGuard for Android, iXGuard for iOS, plus ThreatCast for post-release threat visibility and AppSweep for developer-side static checks. It extends the open-source ProGuard lineage into enterprise-grade obfuscation, anti-tampering, and runtime-aware defenses when high-value apps face reverse engineering and abuse in the wild.',
  },
  {
    slug: 'zimperium',
    name: 'Zimperium',
    url: 'https://www.zimperium.com/',
    description:
      'Zimperium delivers mobile-first application protection under its MAPS (Mobile Application Protection Suite) story: on-device RASP (for example zDefend), hardening such as zShield, and cryptographic key protection with zKeyBox. It targets banks, fintech, and large consumer apps that need continuous runtime integrity, hooking detection, and analyst-recognized depth—not only pre-release scans.',
  },
  {
    slug: 'onespan',
    name: 'OneSpan',
    url: 'https://www.onespan.com/',
    description:
      'OneSpan (formerly Vasco Data Security) combines strong customer authentication, fraud signals, and application shielding—including mobile hardening lines such as Build38—so regulated industries can protect high-risk transactions and the app runtime together. Buyers often evaluate OneSpan when digital banking, identity, and RASP-style controls must sit on one vendor roadmap with compliance-friendly deployment options.',
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
