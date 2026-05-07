/**
 * Sales-enablement copy: plain language, outcomes, and talk tracks for customer-facing teams.
 * Keyed by `CatalogProduct.slug`.
 */
import type { VendorDeepDive } from './vendorDeepDives';
import { VENDOR_DEEP_DIVES } from './vendorDeepDives';

export type ProductSalesBrief = {
  slug: string;
  /** One line you can repeat in an elevator or email subject. */
  tagline: string;
  /** Short paragraph—no acronym soup. */
  inPlainEnglish: string;
  /** Course 2 vendor deep-dive — renders extended sections on /courses/:slug when present. */
  deepDive?: VendorDeepDive;
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
    tagline: 'Banking-only mobile stack: RASP, obfuscation, SIM/device binding, and AI fraud — one SDK, one dashboard.',
    inPlainEnglish:
      'Position Protectt.ai when the buyer needs Indian regulatory mapping, aggressive TCO, and the fastest path to go-live. Four modules share one SDK and one console, with webhooks into SIEM and fraud systems — purpose-built for BFSI rather than generic enterprise mobile.',
    deepDive: VENDOR_DEEP_DIVES['protectt-ai'],
    whyItMatters: [
      'One contract covers AppProtectt, CodeProtectt, AppBind, and Fraud Risk Management — fewer vendors to stitch.',
      'AppBind answers SIM-swap and device-trust questions tied to CBUAE Notice 2025/3057-style conversations.',
      'Pre-mapped RBI / NPCI / SEBI evidence shortens compliance workshops versus generic RASP PDFs.',
    ],
    whoBuysThis: [
      'Indian-influenced banks and exchange houses in UAE; tier-2 GCC banks on tight CBUAE timelines.',
      'CISO and fraud leaders who want AI behavioural models inside the same mobile contract.',
      'Procurement-led buyers comparing TCO across the four-vendor shortlist.',
    ],
    talkTracks: [
      '“One SDK: AppProtectt is the runtime guard, CodeProtectt hides the code, AppBind locks device plus SIM, Fraud Risk Management watches behaviour — all in one dashboard.”',
      '“If the RFP scores Indian regulatory alignment and speed to production, Protectt leads the story.”',
    ],
    objections: [
      {
        question: 'They have not heard the name outside India.',
        answer:
          'Acknowledge, then pivot to reference depth (RBL, Yes Bank, Bajaj Finserv), TechBridge MEA for local presence, and Technieum managed wrap for global support expectations.',
      },
      {
        question: 'Analyst scores matter more than price.',
        answer:
          'Be honest: Protectt is lighter on Gartner/Forrester/QKS than Zimperium or Guardsquare. Pair wins with compliance mapping, TCO, and time-to-live — or recommend a hybrid if the RFP is pure analyst-weighted.',
      },
    ],
    differentiators: [
      'Broadest single-SDK control count in the course comparison.',
      'Native SIM/device binding without bolt-on OTP dependency.',
      'Fastest typical go-live window in the four-vendor set.',
    ],
  },

  guardsquare: {
    slug: 'guardsquare',
    tagline: 'Compile-time hardening from the ProGuard lineage — polymorphic obfuscation, RASP in the binary, ThreatCast in production.',
    inPlainEnglish:
      'Lead Guardsquare when engineering owns the decision: bytecode is transformed in CI/CD, every release is structurally unique, and ThreatCast streams evidence to Splunk-class SIEMs. AppSweep is the free MAST wedge; App Attestation proves API callers are the real app.',
    deepDive: VENDOR_DEEP_DIVES.guardsquare,
    whyItMatters: [
      'Polymorphic output breaks diff-and-replay research between releases.',
      'RASP checks are obfuscated themselves, so attackers cannot trivially hook them away.',
      'Unity/Flutter/React Native coverage wins gaming and exotic fintech stacks.',
    ],
    whoBuysThis: [
      'CTO / VP Engineering-led programmes that prize CI ergonomics.',
      'Banks and payments vendors recovering from cloning or repackaging incidents.',
      'Gaming studios and SDK vendors protecting high-value IP in the binary.',
    ],
    talkTracks: [
      '“DexGuard and iXGuard rewrite the app at build time; ThreatCast tells you what attackers tried in the wild; App Attestation keeps clones off your APIs.”',
      '“When the conversation is IP protection and pipeline elegance, Guardsquare is the primary fit.”',
    ],
    objections: [
      {
        question: 'They want bundled fraud or transaction signing.',
        answer:
          'Guardsquare is deliberately narrower: world-class hardening and telemetry, not a full digital-trust suite. Pair with OneSpan or Zimperium MTD when those gaps are mandatory.',
      },
      {
        question: 'Premium price versus Indian challengers.',
        answer:
          'Anchor on engineering time saved, polymorphic uniqueness, and breach cost — then compare fully loaded scope, not list price per module.',
      },
    ],
    differentiators: [
      'Founder invented the obfuscation stack inside Android itself.',
      'Dedicated App Attestation product for server-side trust.',
      'Free AppSweep lowers friction with mobile engineering teams.',
    ],
  },

  zimperium: {
    slug: 'zimperium',
    tagline: 'MAPS end-to-end mobile app protection — three-time SPARK Leader, FedRAMP, OTA rules, PCI MPoC bundle.',
    inPlainEnglish:
      'Zimperium wins analyst- and intel-led RFPs: zScan through zKeyBox roll into zConsole, z9 ML powers zDefend on-device, and MTD can correlate device-wide telemetry. OTA detection updates and the pre-packaged PCI MPoC story separate it operationally from compile-only vendors.',
    deepDive: VENDOR_DEEP_DIVES.zimperium,
    whyItMatters: [
      'OTA rule pushes respond to new malware families without waiting on app-store cycles.',
      'FedRAMP ATO unlocks federal-style security reviews other mobile vendors cannot match.',
      'PCI MPoC bundle is the shortest narrative for SoftPOS / tap-on-phone readiness.',
    ],
    whoBuysThis: [
      'Tier-1 banks and PSPs where Gartner/QKS scores and threat intel depth decide.',
      'Security architects who must prove device plus in-app correlation (MAPS + MTD).',
      'US healthcare and federal-adjacent teams already standardising on FedRAMP vendors.',
    ],
    talkTracks: [
      '“MAPS covers scan, shield, defend, and keys — zConsole is mission control; MTD is optional but powerful when you must answer what else is wrong on the handset.”',
      '“When the RFP weights analyst leadership, OTA response, or PCI MPoC, Zimperium is the default primary.”',
    ],
    objections: [
      {
        question: 'Integration sounds heavy.',
        answer:
          'Agree — scope Technieum PS for zShield plus zDefend, budget zConsole training, and show FedRAMP/MPoC artefacts that justify the effort.',
      },
      {
        question: 'They insist on Cronto-style signing in the same SKU.',
        answer:
          'Zimperium does not ship transaction signing. Recommend OneSpan for signing-led stacks, or a hybrid architecture with clear hand-offs.',
      },
    ],
    differentiators: [
      'Three-time QKS SPARK In-App Protection Leader in the course materials.',
      'Only vendor in the set with FedRAMP mobile positioning as described.',
      'Native zDefend + MTD correlation for holistic handset visibility.',
    ],
  },

  onespan: {
    slug: 'onespan',
    tagline: 'Digital-trust platform: Cronto signing, Digipass, FIDO leadership, TID risk — App Shielding now Build38-augmented.',
    inPlainEnglish:
      'OneSpan is the longevity and UAE field-presence play: Dubai Silicon Oasis HQ since 2012, board-level FIDO, and Build38 closing the pure-RASP gap. Lead with Cronto and TID when dynamic linking matters; lead with App Shielding + Build38 when the conversation shifts to runtime manipulation.',
    deepDive: VENDOR_DEEP_DIVES.onespan,
    whyItMatters: [
      'Many GCC banks already own Digipass/Cronto — app shielding lands as a contract addendum, not a net-new vendor fight.',
      'Cronto encodes the real beneficiary in the cryptogram, defeating trojan screen rewrite attacks.',
      'NASDAQ financial profile plus serial acquisitions (Nok Nok, Build38) answers vendor-risk committees.',
    ],
    whoBuysThis: [
      'Tier-1 banks with vendor-risk frameworks favouring public, long-tenured suppliers.',
      'Programmes mandating PSD2 dynamic linking with regulator-trusted signing technology.',
      'Institutions that want FIDO, fraud orchestration, and shielding under one procurement vehicle.',
    ],
    talkTracks: [
      '“TID orchestrates risk; MSS supplies the SDK bricks; App Shielding plus Build38 is the runtime guard; Cronto is how we prove the transaction the user sees is the transaction they sign.”',
      '“If they already badge into OneSpan, extend the relationship before introducing a fourth mobile vendor.”',
    ],
    objections: [
      {
        question: 'Technical teams think OneSpan is only tokens.',
        answer:
          'Open with App Shielding plus the Build38 roadmap, cite on-device telemetry and cloud-backed controls, then bring Cronto and TID proof points behind their priorities.',
      },
      {
        question: 'They only want best-of-breed RASP, nothing else.',
        answer:
          'Acknowledge premium suite economics — if the RFP is RASP-only and analyst-scored, Zimperium or Guardsquare may fit better; use OneSpan when signing, FIDO, and shielding must move together.',
      },
    ],
    differentiators: [
      'Deepest UAE/GCC field organisation of the four-vendor shortlist.',
      'FIDO board seat and Nok Nok acquisition for passwordless leadership.',
      'Build38 acquisition (March 2026) upgrades SDK RASP to cloud-backed, AI-augmented posture.',
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
