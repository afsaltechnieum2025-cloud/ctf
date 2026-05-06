/**
 * MCQ banks aligned with `productSalesBriefs.ts` so reps practice the same story as the product pages.
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
  options: [string, string, string, string, string];
  correctIndex: number;
};

export type ProductMcqSet = readonly McqQuestion[];

export const MCQS_BY_SLUG: Record<string, ProductMcqSet> = {
  'protectt-ai': [
    {
      correctIndex: 2,
      options: [
        'A mobile binary lab scanner that only runs before the app is released.',
        'A DSPM platform that maps sensitive files to employee identities.',
        'A runtime-focused vendor that keeps live apps trustworthy after release—guarding tampering, fakes, and fraud in the wild.',
        'An endpoint XDR suite that stitches MalOps across laptops and servers.',
        'An API gateway that discovers partner traffic and bot abuse.',
      ],
    },
    {
      correctIndex: 0,
      options: [
        'Reduce fraud and brand damage from cloned or modified apps; give teams evidence on abnormal behavior; shorten field investigations.',
        'Replace every SIEM, SOAR, and ticketing integration with one SKU.',
        'Provide guaranteed zero false positives for all static analysis findings.',
        'Host the customer’s production database in the vendor’s cloud by default.',
        'Automatically rewrite insecure mobile source code in every pull request.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Be the only tool you need for GDPR documentation without legal review.',
        'Replace a full secure-SDLC and pre-release testing program by itself—it adds runtime integrity after ship, not instead of design-time work.',
        'Act as a full replacement for enterprise PKI, IAM, and network segmentation alone.',
        'Host the customer’s production database in the vendor’s cloud by default.',
        'Eliminate the need for any fraud operations center or chargeback process.',
      ],
    },
    {
      correctIndex: 1,
      options: [
        'Only relevant for desktop browsers from the early 2000s.',
        'Runtime and post-release visibility that static scans miss—strong for mobile-first, high-fraud industries.',
        'Cheaper seat pricing than every consumer antivirus combined.',
        'Exclusive focus on mainframe green-screen session recording.',
        'Native replacement for a general-purpose CRM pipeline.',
      ],
    },
    {
      correctIndex: 4,
      options: [
        'Cannot integrate with any mobile CI/CD pipeline.',
        'Requires uninstalling all endpoint agents before rollout.',
        'Ignores telemetry from rooted or jailbroken devices entirely.',
        'Ships only as hardware dongles for retail POS terminals.',
        'Still needs thoughtful SDK/integration and pairing with secure SDLC—not “drop in and ignore.”',
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
