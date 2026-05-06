/**
 * Sales-enablement copy: plain language, outcomes, and talk tracks for customer-facing teams.
 * Keyed by `CatalogProduct.slug`.
 */
export type ProductSalesBrief = {
  slug: string;
  /** One line you can repeat in an elevator or email subject. */
  tagline: string;
  /** Short paragraph—no acronym soup. */
  inPlainEnglish: string;
  /** Why a buyer cares (business outcomes). */
  whyItMatters: string[];
  /** Who typically signs or champions the deal. */
  whoBuysThis: string[];
  /** Phrases you can use on a call (not a script—adapt to your tone). */
  talkTracks: string[];
  /** Anticipate pushback with simple, honest answers. */
  objections: { question: string; answer: string }[];
  /** How we win the story vs “more tools” or status quo. */
  differentiators: string[];
};

export const PRODUCT_SALES_BRIEFS: Record<string, ProductSalesBrief> = {
  'protectt-ai': {
    slug: 'protectt-ai',
    tagline: 'Keeps your live mobile and app experience trustworthy after release—not just before.',
    inPlainEnglish:
      'Protectt.ai watches how real apps behave in the real world: tampering, fake apps, fraud hooks, and abuse. Think of it as “runtime guardrails” once the customer has already downloaded your app. It pairs with design-time testing; it does not replace secure coding, but it answers what happens when bad actors attack the app customers actually run.',
    whyItMatters: [
      'Reduces fraud losses and brand damage from cloned or modified apps.',
      'Gives security and product teams evidence when users behave abnormally.',
      'Shortens “we got a report from the field” investigations with telemetry you otherwise would not have.',
    ],
    whoBuysThis: [
      'Mobile product owners and digital banking / fintech leaders.',
      'App security or fraud teams under pressure from regulators or auditors.',
      'Enterprises with high-value consumer apps (payments, loyalty, identity).',
    ],
    talkTracks: [
      '“This is about protecting the app after it ships—fakes, tampering, and fraud in the wild, not just finding bugs in a lab.”',
      '“If your risk is ‘what happens on millions of devices we don’t control,’ that’s the conversation Protectt is built for.”',
    ],
    objections: [
      {
        question: 'Isn’t this the same as scanning the app before release?',
        answer:
          'Pre-release scanning finds code issues. Protectt focuses on runtime integrity and abuse when the binary is on a user’s phone—different problem, complementary tools.',
      },
      {
        question: 'Will developers push back?',
        answer:
          'Position it as protecting revenue and users, not blaming engineering. Most teams welcome visibility when rollouts are tied to clear playbooks, not finger-pointing.',
      },
    ],
    differentiators: [
      'Runtime and post-release lens vs design-time-only testing.',
      'Strong story for mobile-first and high-fraud industries.',
      'Speaks the language of trust, telemetry, and incident response—not only CVE counts.',
    ],
  },

  appknox: {
    slug: 'appknox',
    tagline: 'Enterprise-grade mobile app security testing—automated scans plus expert testing when you need depth.',
    inPlainEnglish:
      'Appknox helps organizations test mobile apps the way attackers think: from the compiled app (binary), across static, dynamic, and API-related checks, with options for human-led penetration testing. It also helps track what’s inside the app (components / SBOM-style views) and can watch app stores for drift, impersonation, or policy issues. Ideal when “we need proof for procurement or compliance” on mobile.',
    whyItMatters: [
      'Speeds up release cycles with repeatable, documented testing.',
      'Gives procurement-friendly evidence for regulated industries.',
      'Reduces surprise findings late in a mobile launch or vendor review.',
    ],
    whoBuysThis: [
      'Head of AppSec, CISO office, or security engineering leads with a mobile-heavy portfolio.',
      'Large enterprises and banks rolling customer-facing apps globally.',
      'Partners who need a credible mobile testing story for their clients.',
    ],
    talkTracks: [
      '“If your customer ships iOS and Android to millions of users, Appknox is the ‘prove it was tested’ story—binary-based, not just a checkbox scanner.”',
      '“We can combine automation for every build with expert pen tests for major releases or acquisitions.”',
    ],
    objections: [
      {
        question: 'We already have a general AST/DAST vendor.',
        answer:
          'Many AST/DAST tools are not optimized for mobile binaries and store realities. Appknox is purpose-built for mobile app risk and store monitoring—position as specialized, not duplicate.',
      },
      {
        question: 'Sounds expensive for mid-market.',
        answer:
          'Anchor on cost of a bad mobile incident vs cost of continuous testing. Appknox also helps prioritize what to fix first—less noise, clearer exec updates.',
      },
    ],
    differentiators: [
      'Mobile-native narrative: binary analysis, APIs, store posture.',
      'SBOM / component visibility resonates with supply-chain conscious buyers.',
      'Clear upsell path from automated scans to expert-led PT.',
    ],
  },

  cybereason: {
    slug: 'cybereason',
    tagline: 'Endpoint and XDR defense that tells the story of an attack—not a thousand disconnected alerts.',
    inPlainEnglish:
      'Cybereason protects laptops, servers, and related surfaces with NGAV, EDR, and broader XDR. Its “MalOp” story is about showing defenders one coherent attack operation instead of scattered alerts. Managed services exist for customers who want 24×7 eyes on glass without building a huge SOC overnight.',
    whyItMatters: [
      'Faster detection and response when seconds matter (ransomware, lateral movement).',
      'Less analyst burnout from chasing false or low-context alerts.',
      'Strong enterprise procurement story: platform + services.',
    ],
    whoBuysThis: [
      'SOC managers, detection & response leaders, IT security directors.',
      'Mid-market to global enterprises modernizing endpoint stacks.',
      'Organizations recovering from or preparing for ransomware scenarios.',
    ],
    talkTracks: [
      '“Instead of your team stitching fifty alerts together, Cybereason shows the malicious operation as one narrative.”',
      '“If the buyer is drowning in endpoint noise, lead with MalOps and time-to-contain—not feature lists.”',
    ],
    objections: [
      {
        question: 'CrowdStrike / SentinelOne already own the endpoint market.',
        answer:
          'Acknowledge leaders, then pivot to operational efficiency and analyst experience. Many deals are won on workflow fit, services, and TCO—not logos alone.',
      },
      {
        question: 'We don’t have a SOC.',
        answer:
          'That’s where managed detection offerings help—Cybereason can augment lean teams so the buyer still gets mature coverage.',
      },
    ],
    differentiators: [
      'Operation-centric messaging vs alert-centric fatigue.',
      'Breadth from prevention through managed response.',
      'Strong ransomware and incident-response adjacency in positioning.',
    ],
  },

  cequence: {
    slug: 'cequence',
    tagline: 'Protects APIs, apps, and AI-driven traffic where traditional WAFs leave gaps.',
    inPlainEnglish:
      'Cequence focuses on the modern attack surface: APIs everywhere, bots scraping or abusing flows, and new risks from AI agents calling backends. Buyers get discovery, posture, bot mitigation, WAAP-style protections, and controls suited to high-change microservices and gateways—not “set and forget” perimeter rules only.',
    whyItMatters: [
      'Stops business logic abuse, scraping, and account takeover paths that WAFs miss.',
      'Improves API inventory and risk posture for audits and zero-trust initiatives.',
      'Prepares organizations for AI agents touching sensitive endpoints.',
    ],
    whoBuysThis: [
      'API platform owners, cloud security architects, and application security leaders.',
      'Digital businesses with public APIs, partners, and high automation.',
      'Regulated sectors needing defensible API governance (finance, healthcare, telecom).',
    ],
    talkTracks: [
      '“If APIs are your product, Cequence is about governance and abuse at that layer—not just blocking generic web attacks.”',
      '“When the buyer talks about bots, partner integrations, or AI copilots hitting APIs, that’s the Cequence conversation.”',
    ],
    objections: [
      {
        question: 'We already have an API gateway.',
        answer:
          'Gateways route traffic; they don’t replace discovery, abuse detection, and consistent policy across many gateways and services. Position Cequence as the security intelligence layer around APIs.',
      },
      {
        question: 'Sounds complex to deploy.',
        answer:
          'Emphasize phased rollout: discover first, then prioritize protections on the riskiest APIs. Quick wins build internal champions.',
      },
    ],
    differentiators: [
      'API + bot + AI-agent storyline is timely and distinct from legacy WAF pitches.',
      'Speaks to microservices sprawl and partner-facing endpoints.',
      'Strong mapping to abuse cases (scraping, ATO, logic abuse) buyers feel daily.',
    ],
  },

  fortra: {
    slug: 'fortra',
    tagline: 'A broad cybersecurity and automation portfolio under one roof—fewer vendors, clearer procurement.',
    inPlainEnglish:
      'Fortra is not a single-point product; it’s a platform company spanning data protection, secure managed file transfer, infrastructure security, and more. Sales conversations often center on consolidation: one relationship, integrated workflows, and consistent reporting for hybrid environments. Good fit when the buyer wants breadth and vendor rationalization—not a niche tool only.',
    whyItMatters: [
      'Reduces vendor sprawl and integration tax for IT and security leadership.',
      'Helps standardize controls across on-prem, cloud, and regulated workloads.',
      'Simplifies renewals and enterprise agreements for procurement.',
    ],
    whoBuysThis: [
      'CISOs and IT directors under mandate to consolidate suppliers.',
      'Infrastructure and operations teams owning file transfer and data movement.',
      'MSPs and integrators packaging repeatable stacks for clients.',
    ],
    talkTracks: [
      '“If your customer is tired of stitching twenty niche tools, Fortra is the ‘fewer invoices, more coverage’ story.”',
      '“Lead with outcomes—secure transfer, data protection, automation—then map modules to their gaps.”',
    ],
    objections: [
      {
        question: '“Portfolio vendor” sounds jack-of-all-trades.',
        answer:
          'Acknowledge, then reframe: buyers often want a credible suite with cross-product roadmaps and support. Depth exists per product line—position modules, not the abstract logo.',
      },
      {
        question: 'They only need one small piece.',
        answer:
          'Land-and-expand: start with the acute pain (e.g., managed file transfer), then attach adjacent modules where trust is built.',
      },
    ],
    differentiators: [
      'Consolidation and TCO narrative resonates in enterprise RFPs.',
      'Breadth supports multi-year roadmaps instead of one-off fixes.',
      'Strong for hybrid enterprises with legacy and cloud together.',
    ],
  },

  lightbeam: {
    slug: 'lightbeam',
    tagline: 'Know where sensitive data lives, who can reach it, and how to reduce exposure—at scale.',
    inPlainEnglish:
      'Lightbeam is identity-centric DSPM: discover sensitive data across cloud, SaaS, and on-prem, tie it to people and roles, and drive remediation and privacy workflows. Sales teams should anchor on “data + identity + automation,” not just DLP keywords. It helps prove least privilege, accelerate privacy requests, and reduce ransomware blast radius by shrinking overexposed data.',
    whyItMatters: [
      'Makes privacy and security teams faster at finding and fixing real exposure—not spreadsheets.',
      'Improves audit posture for GDPR, HIPAA-style, and internal risk committees.',
      'Reduces insider and ransomware risk by shrinking unnecessary access to sensitive data.',
    ],
    whoBuysThis: [
      'CISO / data security leaders and privacy officers under board pressure.',
      'Cloud-first orgs with sprawling SaaS and data lakes.',
      'Highly regulated industries needing defensible access stories.',
    ],
    talkTracks: [
      '“Lightbeam answers: where is our sensitive data, who can touch it, and what should we fix first?”',
      '“If the buyer talks about Copilot, AI search, or shadow SaaS, connect that to accidental oversharing—Lightbeam’s sweet spot.”',
    ],
    objections: [
      {
        question: 'We already run a DLP program.',
        answer:
          'DLP often enforces at egress; DSPM improves discovery, classification, and identity linkage upstream. Position as complementary modernization, not rip-and-replace, unless the buyer wants that.',
      },
      {
        question: 'Data discovery projects stall internally.',
        answer:
          'Lead with prioritized remediation and executive dashboards—quick wins build momentum; avoid “scan everything forever” framing.',
      },
    ],
    differentiators: [
      'Identity-linked data map is a crisp differentiator vs legacy DLP-only pitches.',
      'Strong AI-era narrative: control data before assistants amplify mistakes.',
      'Speaks to both security and privacy buyers with one platform story.',
    ],
  },
};

export function getSalesBrief(slug: string): ProductSalesBrief | undefined {
  return PRODUCT_SALES_BRIEFS[slug];
}
