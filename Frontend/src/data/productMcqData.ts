/**
 * Quiz question banks aligned with `productSalesBriefs.ts` so reps practice the same story as the product pages.
 * Five stems × five options; `correctIndex` points to the answer that matches the sales brief.
 */
export const MCQ_QUESTION_STEMS = [
  'Who am I?',
  'What can I do?',
  'What can I not do?',
  'What is my advantage?',
  'What is my disadvantage?',
] as const;

export type McqQuestion = {
  question?: string;
  options: readonly string[];
  correctIndex: number;
};

export type ProductMcqSet = readonly McqQuestion[];

export const MCQS_BY_SLUG: Record<string, ProductMcqSet> = {
  /** Section E — Course 3 Certification (TECH-EDU-RASP-301), Q34–Q38 */
  'protectt-ai': [
    {
      question: 'Protectt.ai is headquartered in:',
      correctIndex: 1,
      options: [
        'Bengaluru, India',
        'Mumbai, India',
        'Dubai, UAE',
        'Singapore',
      ],
    },
    {
      question: 'The Protectt.ai module that performs Runtime Application Self-Protection is called:',
      correctIndex: 2,
      options: [
        'CodeProtectt',
        'AppBind',
        'AppProtectt',
        'FraudGuard',
      ],
    },
    {
      question: 'AppBind, by Protectt.ai, is primarily used for:',
      correctIndex: 1,
      options: [
        'Physically gluing two phones together',
        'SIM and device binding to lock banking access to verified devices and SIMs',
        'Submitting apps to the app store',
        'Marketing analytics and customer segmentation',
      ],
    },
    {
      question: 'Protectt.ai’s controls are most directly mapped to which Indian regulators’ directives?',
      correctIndex: 1,
      options: [
        'SEBI only',
        'RBI Digital Payment Security Controls, NPCI SIM/Device Binding, and SEBI Cyber Resilience Framework',
        'IRDAI (insurance regulator) only',
        'None — Protectt.ai is exclusively UAE-focused',
      ],
    },
    {
      question: 'Protectt.ai’s announced distribution partner for the Middle East and Africa is:',
      correctIndex: 1,
      options: [
        'Help AG',
        'TechBridge Distribution MEA',
        'Spire Solutions',
        'StarLink',
      ],
    },
  ],

  /** Section F — Course 3 Certification (TECH-EDU-RASP-301), Q39–Q43 */
  guardsquare: [
    {
      question: 'Guardsquare’s product for protecting Android applications is:',
      correctIndex: 1,
      options: ['iXGuard', 'DexGuard', 'ZimGuard', 'AppShield'],
    },
    {
      question: 'Guardsquare’s product for protecting iOS applications is:',
      correctIndex: 1,
      options: ['DexGuard', 'iXGuard', 'iOSProtect', 'AppleGuard'],
    },
    {
      question: 'Guardsquare’s open-source heritage is the:',
      correctIndex: 0,
      options: [
        'ProGuard project (Android shrinker / obfuscator)',
        'OpenSSL project',
        'Apache Software Foundation',
        'Linux Kernel project',
      ],
    },
    {
      question: 'Guardsquare’s real-time post-publication threat-monitoring console is called:',
      correctIndex: 0,
      options: ['ThreatCast', 'zConsole', 'AppWatch', 'ProTracker'],
    },
    {
      question: 'AppSweep, by Guardsquare, is best described as:',
      correctIndex: 1,
      options: [
        'A premium paid product for runtime defence',
        'A free static-analysis (MAST) tool that identifies security issues in mobile apps',
        'A device-cleaning utility for old phones',
        'An offline backup tool for mobile data',
      ],
    },
  ],

  /** Section G — Course 3 Certification (TECH-EDU-RASP-301), Q44–Q48 */
  zimperium: [
    {
      question: 'MAPS, in the Zimperium product naming, stands for:',
      correctIndex: 1,
      options: [
        'Mobile App Penetration Suite',
        'Mobile Application Protection Suite',
        'Multi-Access Protection Service',
        'Managed App Performance Suite',
      ],
    },
    {
      question: 'The Zimperium module that provides on-device runtime protection (RASP) is:',
      correctIndex: 2,
      options: ['zScan', 'zShield', 'zDefend', 'zKeyBox'],
    },
    {
      question: 'zShield, in the Zimperium suite, is responsible for:',
      correctIndex: 1,
      options: [
        'Threat-intelligence reporting',
        'Application hardening — obfuscation, anti-tampering and encryption — at compile-time or post-compile',
        'Customer authentication only',
        'Customer billing and licensing',
      ],
    },
    {
      question: 'zKeyBox is dedicated to:',
      correctIndex: 1,
      options: [
        'Storing user passwords',
        'White-box cryptography to protect cryptographic keys from extraction or manipulation',
        'Customer chat support',
        'Push notifications to end-users',
      ],
    },
    {
      question:
        'Zimperium has been recognised as a Leader in QKS Group’s SPARK Matrix for In-App Protection:',
      correctIndex: 1,
      options: [
        'Once, in 2025 only',
        'For three years running — 2023, 2024 and 2025',
        'Never',
        'Only in the Asia-Pacific edition',
      ],
    },
  ],

  /** Section H — Course 3 Certification (TECH-EDU-RASP-301), Q49–Q53 */
  onespan: [
    {
      question: 'OneSpan was previously known as:',
      correctIndex: 1,
      options: [
        'Symantec Corporation',
        'Vasco Data Security International',
        'RSA Security',
        'Verizon Security',
      ],
    },
    {
      question:
        'OneSpan’s transaction-signing technology, using a graphical colour cryptogram (visual cryptogram), is called:',
      correctIndex: 1,
      options: ['DigiSign', 'Cronto', 'ColorAuth', 'QR-Sign'],
    },
    {
      question: 'OneSpan’s international (EMEA) headquarters has been located in which UAE district since 2012?',
      correctIndex: 1,
      options: [
        'Dubai International Financial Centre (DIFC)',
        'Dubai Silicon Oasis',
        'Abu Dhabi Global Market (ADGM)',
        'Sharjah Free Zone',
      ],
    },
    {
      question: 'OneSpan’s March-2026 acquisition that significantly enhances its mobile RASP offering is:',
      correctIndex: 1,
      options: ['Zimperium', 'Build38', 'Guardsquare', 'Protectt.ai'],
    },
    {
      question: 'OneSpan sits on the board of which authentication standards body?',
      correctIndex: 1,
      options: [
        'PCI Security Standards Council',
        'FIDO Alliance',
        'ISO 27001 Committee',
        'SWIFT',
      ],
    },
  ],

  appknox: [
    {
      correctIndex: 1,
      options: [
        'A DSPM catalog that scores sensitive data across SaaS sprawl.',
        'Enterprise mobile security testing from the binary—SAST/DAST/API-style checks, expert PT, SBOM-style visibility, store monitoring.',
        'A managed SOC that replaces internal analysts for ransomware response.',
        'A WAAP-only vendor for microservice gateways and AI agents.',
        'Runtime RASP that blocks hooking on end-user phones after launch.',
      ],
    },
    {
      correctIndex: 2,
      options: [
        'Negotiate cyber-insurance premiums automatically with carriers.',
        'Translate employment contracts into local labor law summaries.',
        'Speed releases with repeatable, documented testing and procurement-friendly evidence for regulated mobile apps.',
        'Replace HR onboarding workflows for contractors globally.',
        'Provide satellite bandwidth planning for remote offices.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Be a drop-in duplicate of every general AST/DAST story—buyers should position it as mobile- and store-specialized, not “more of the same.”',
        'Guarantee removal of every false positive in every security tool worldwide.',
        'Patch operating systems on air-gapped OT networks without agents.',
        'Host regulated patient imaging archives by default.',
        'Eliminate the need for any executive reporting on risk.',
      ],
    },
    {
      correctIndex: 3,
      options: [
        'Only supports smartwatch apps under 5 MB.',
        'Ignores API traffic inside mobile builds.',
        'Cannot integrate with CI/CD or release automation.',
        'Mobile-native narrative: binaries, APIs, store posture, and a clear path from automation to expert pen tests.',
        'Single-use PDF report generator with no automation.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Always free for unlimited enterprise binaries with no support contract.',
        'Teams must still prioritize fixes and own remediation—depth of scope can mean work, not magic.',
        'Disallows collaboration between security and development teams.',
        'Cannot scan iOS or Android binaries at all.',
        'Requires removing all third-party components before upload.',
      ],
    },
  ],

  cybereason: [
    {
      correctIndex: 3,
      options: [
        'A DSPM tool for identity-linked sensitive data discovery.',
        'A WAAP vendor focused on API bots and scraping only.',
        'A mobile store-monitoring suite for impersonation apps.',
        'NGAV/EDR/XDR that shows one coherent malicious operation (“MalOp”) instead of endless disconnected alerts.',
        'A payroll fraud analytics engine for HR departments.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Faster detection and response for ransomware and lateral movement; less analyst burnout from low-context noise; platform + services procurement story.',
        'Automated UI design reviews for consumer mobile apps.',
        'Primary storage for immutable blockchain transaction logs.',
        'Replacement for enterprise email archiving only.',
        'Hardware microcode updates for CPUs without reboot.',
      ],
    },
    {
      correctIndex: 2,
      options: [
        'Guarantee 100% prevention of every zero-day without tuning.',
        'Replace legal counsel for breach notification letters worldwide.',
        'Win deals purely on logo wars—positioning still needs workflow fit, services, and TCO vs named leaders.',
        'Operate without any endpoint agent footprint.',
        'Eliminate the need for any incident response retainer.',
      ],
    },
    {
      correctIndex: 4,
      options: [
        'Only supports five laptops per customer tenant.',
        'Cannot integrate with identity providers or cloud workloads.',
        'Ignores ransomware behavior patterns entirely.',
        'Requires uninstalling all other endpoint tools first.',
        'Operation-centric story: less alert noise, clearer attack narrative, strong ransomware and IR adjacency.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Adds no value for lean IT shops.',
        'Breadth of modules and deployment choices can mean rollout and tuning effort—not instant “one checkbox” maturity.',
        'Disallows managed detection services entirely.',
        'Cannot scale beyond ten endpoints globally.',
        'Works only on disconnected typewriters.',
      ],
    },
  ],

  cequence: [
    {
      correctIndex: 0,
      options: [
        'API, app, and AI-traffic protection—discovery, posture, bots, WAAP-style controls where WAFs leave gaps.',
        'A mobile binary scanner focused on store impersonation only.',
        'A DSPM identity graph for sensitive unstructured data only.',
        'An endpoint MalOp console for Windows servers.',
        'A payroll reconciliation engine for multinational HR.',
      ],
    },
    {
      correctIndex: 4,
      options: [
        'Compile Android APKs in a shared build farm only.',
        'Replace every API gateway routing decision automatically.',
        'Provide legal contract review for vendor M&A.',
        'Operate as a general ERP for manufacturing inventory.',
        'Stop business-logic abuse and scraping, improve API inventory for audits/zero trust, and prepare for AI agents hitting backends.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Replace every API gateway’s routing table without configuration.',
        'Be only a duplicate of gateway routing—Cequence is the security intelligence layer around APIs, not the router.',
        'Guarantee zero bots on the public internet globally.',
        'Eliminate the need for any authentication on partner APIs.',
        'Patch Linux kernels remotely without maintenance windows.',
      ],
    },
    {
      correctIndex: 2,
      options: [
        'Ignores microservices sprawl entirely.',
        'Only supports SOAP services from 2003.',
        'Timely API + bot + AI-agent storyline vs legacy perimeter-only WAF pitches.',
        'Cannot see traffic that crosses HTTP gateways.',
        'Disallows phased discovery before enforcement.',
      ],
    },
    {
      correctIndex: 3,
      options: [
        'Free unlimited API traffic inspection with no rate limits.',
        'Requires removing all API gateways before install.',
        'Cannot integrate with CI/CD or partner portals.',
        'Microservice estates need phased rollout and prioritization—complex environments take internal champions and work.',
        'Works only on weekends in a single time zone.',
      ],
    },
  ],

  fortra: [
    {
      correctIndex: 2,
      options: [
        'A single-purpose mobile anti-cheat for gaming studios.',
        'A DSPM catalog for identity-linked sensitive data only.',
        'A broad cybersecurity and automation portfolio—consolidation, integrated workflows, hybrid reporting under one vendor relationship.',
        'An API-only WAAP for AI agent traffic.',
        'A consumer password manager with family sharing.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Reduce vendor sprawl, standardize controls across on-prem and cloud, and simplify procurement with multi-module roadmaps.',
        'Design physical office floor plans and seating charts.',
        'Operate as a social network for enterprise pets.',
        'Compile SwiftUI previews for Apple Watch only.',
        'Provide satellite weather forecasting for logistics fleets.',
      ],
    },
    {
      correctIndex: 2,
      options: [
        'Guarantee one SKU solves every OT protocol on earth.',
        'Remove the need for any vendor support contract forever.',
        'Remove the need to scope modules—buyers still map products to gaps; “portfolio” means breadth, not automatic depth everywhere.',
        'Host classified workloads in every region by default without review.',
        'Eliminate all third-party software in the customer stack overnight.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Portfolio limited to a single 10-line shell script.',
        'Consolidation + TCO narrative that wins enterprise RFPs and multi-year roadmaps vs point tools.',
        'No appeal to hybrid regulated enterprises.',
        'Cannot be sold by MSPs or integrators.',
        'Disallows any cloud deployment model.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Buyers must still pick the right modules and integrate thoughtfully—breadth is power but not automatic simplicity.',
        'Impossible to misconfigure because no options exist.',
        'Always cheaper than every point solution in every category simultaneously.',
        'Cannot be used with managed service providers.',
        'Requires removing all legacy systems before day one.',
      ],
    },
  ],

  lightbeam: [
    {
      correctIndex: 1,
      options: [
        'A WAAP-only product for microservice gateways.',
        'Identity-centric DSPM: discover sensitive data, map to people/roles, automate remediation and privacy workflows.',
        'An endpoint MalOp console for Windows and Linux servers.',
        'A mobile store-monitoring suite for impersonation apps.',
        'A video CDN optimization suite for streaming sports.',
      ],
    },
    {
      correctIndex: 3,
      options: [
        'Replace all legal privacy counsel with a single checkbox.',
        'Operate as a general ERP for manufacturing supply chain.',
        'Compile Rust firmware for edge routers only.',
        'Speed privacy/security teams with discovery-to-fix loops, better audit posture, and smaller blast radius via least privilege.',
        'Provide medical diagnosis from unstructured patient PDFs.',
      ],
    },
    {
      correctIndex: 2,
      options: [
        'Remove every data-classification policy with no stewardship.',
        'Guarantee zero insider risk without culture or process.',
        'Be a rip-and-replace for every DLP program by default—often complementary modernization at egress vs upstream DSPM.',
        'Patch every CVE in every dependency overnight automatically.',
        'Host credit-card PAN storage in the vendor data lake.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Identity-linked data map and AI-era “control data before assistants overshare” story vs legacy DLP-only pitches.',
        'Ignores unstructured data sources entirely.',
        'Cannot label or score sensitive fields.',
        'Only works on CSV files under 1 KB.',
        'Disallows integration with cloud object stores.',
      ],
    },
    {
      correctIndex: 4,
      options: [
        'Adds no value for GDPR-style accountability.',
        'Cannot run discovery jobs on cloud SaaS.',
        'Requires removing all existing DLP tools before day one.',
        'Eliminates 100% of false positives automatically with no tuning.',
        'Needs executive dashboards, prioritized remediation, and data-owner alignment—discovery alone can stall without a plan.',
      ],
    },
  ],
};

export function getMcqSetForSlug(slug: string): ProductMcqSet | undefined {
  return MCQS_BY_SLUG[slug];
}
