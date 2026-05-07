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
    tagline: 'From zero to conversational: mobile RASP explained properly',
    summary:
      'Foundation training for mobile RASP: why mobile is different, how attacks work, the five defense layers, compliance drivers, and how to evaluate vendors confidently.',
    relatedProductSlugs: ['protectt-ai'],
    sections: [
      {
        heading: 'Why mobile app security is a special problem',
        paragraphs: [
          'Mobile banking apps do not run in bank-controlled environments. They run on customer devices that may be rooted, jailbroken, emulated, malware-infected, or actively manipulated by attackers. This is fundamentally different from web apps protected behind server-side perimeter controls.',
          'Five realities drive the need for mobile RASP: unmanaged devices, app binaries exposed to reverse engineering, hostile runtime environments, declining trust in SMS/email OTP, and limited server visibility once attackers control the device. The practical conclusion is simple: if the bank cannot control the phone, the app must defend itself.',
        ],
      },
      {
        heading: 'What RASP is and what it continuously does',
        paragraphs: [
          'Runtime Application Self-Protection (RASP) is security code that lives inside the running mobile app, monitors the surrounding environment, and reacts in real time. In plain language: perimeter tools guard the entrance, but RASP travels with the app.',
          'Operationally, mature RASP programs do three things continuously: detect hostile conditions (root/jailbreak/emulator/hooking), validate app integrity (tampering/repackaging/untrusted libraries), and respond according to policy (warn, block transaction, terminate session, downgrade features, or refuse to run).',
        ],
      },
      {
        heading: 'How RASP is integrated into apps',
        paragraphs: [
          'There are three common integration models. Compile-time integration rewrites app bytecode during builds and is usually the deepest protection. SDK integration adds vendor libraries into the app and is typically the most flexible enterprise path. Binary wrapping is fast and no-code, but often less deep than compile-time or SDK methods.',
          'As a rule of thumb from the course: compile-time is deepest, SDK is most flexible, no-code wrapping is fastest. In practice, many enterprise deployments use SDK integration as the base and add compile-time hardening where required.',
        ],
      },
      {
        heading: 'How mobile attacks happen in the real world',
        paragraphs: [
          'Four attack patterns are emphasized in this foundation course: static reverse engineering of app binaries, dynamic hooking with tools like Frida, banking trojans using overlay plus accessibility abuse, and SIM-swap-enabled account takeover flows.',
          'These patterns show why runtime defense matters. Attackers do not only probe APIs from outside; they manipulate the app on-device, intercept flows, and bypass client-side checks. Effective defense requires app hardening, runtime integrity checks, network trust controls like SSL pinning, and stronger in-app authentication patterns beyond SMS OTP.',
        ],
      },
      {
        heading: 'The five layers of RASP defense',
        paragraphs: [
          'Layer 1 is code hardening (including obfuscation) to resist static analysis and cloning. Layer 2 is anti-tampering and integrity checks to catch repackaging and code modification. Layer 3 is environment integrity to detect hostile runtime conditions such as root, emulators, overlays, and abuse paths.',
          'Layer 4 is network trust (for example SSL pinning and MITM resistance). Layer 5 is cryptographic key protection, including white-box and hardware-backed approaches where appropriate. A clear customer conversation should map each threat objection to one of these five layers.',
        ],
      },
      {
        heading: 'RASP vs WAF vs MTD vs MAST',
        paragraphs: [
          'These are complementary, not interchangeable. WAF protects web/API traffic at the server edge. RASP protects one specific app from inside runtime. MTD monitors device-wide threats across apps and network behavior. MAST is a pre-release testing discipline for finding vulnerabilities before deployment.',
          'The practical positioning used in customer conversations: WAF protects servers, RASP protects the app, MTD protects the device, and MAST improves release quality before runtime. Serious programs typically need all four.',
        ],
      },
      {
        heading: 'Compliance and regulatory drivers',
        paragraphs: [
          'The course highlights that many RASP decisions are compliance-driven, not feature-driven. For UAE contexts, it references CBUAE Notice 2025/3057 (with transition away from SMS/email OTP as sole mechanisms), the 2025 CBUAE law framework, and related guidance affecting controlled transaction channels.',
          'It also points to adjacent global reference frameworks customers may cite: PSD2, PCI MPoC, RBI/NPCI/SEBI, SAMA, and MAS TRM. The key sales skill is translating regulatory expectations into practical mobile control recommendations.',
        ],
      },
      {
        heading: '10-point checklist for evaluating vendors',
        paragraphs: [
          'Use a consistent checklist: five-layer coverage, platform breadth (native and cross-platform), integration fit with CI/CD, measurable performance impact, OTA policy updates, telemetry/SIEM integration, compliance evidence quality, bundled capabilities (for example device binding or signing), vendor stability, and regional support model.',
          'This structure keeps evaluations objective and comparable. It also helps teams move from feature demos to implementation readiness, operational fit, and audit alignment.',
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
