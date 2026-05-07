/**
 * Course 2 — Vendor Product Deep-Dives (TECH-EDU-RASP-201).
 * Drives extended layout on /courses/:slug for the four RASP shortlist vendors.
 */
export type VendorDeepDive = {
  sourceDoc: string;
  /** Company at a glance rows */
  snapshot: { label: string; value: string }[];
  /** Product architecture — how it fits together */
  architecture: string;
  modules: {
    name: string;
    technical: string;
    plainEnglish: string;
  }[];
  keyFeatures: string[];
  integration: string;
  strengths: string[];
  limitations: string[];
  compliance: string[];
  typicalCustomers: string[];
};

export const RASP_VENDOR_SLUGS = ['protectt-ai', 'guardsquare', 'zimperium', 'onespan'] as const;
export type RaspVendorSlug = (typeof RASP_VENDOR_SLUGS)[number];

export const VENDOR_DEEP_DIVES: Record<RaspVendorSlug, VendorDeepDive> = {
  'protectt-ai': {
    sourceDoc: 'Technieum Course 2 — Vendor Deep-Dives (TECH-EDU-RASP-201), Ch. 2',
    snapshot: [
      { label: 'Headquarters', value: 'Mumbai, India' },
      {
        label: 'Founded',
        value: '2020 — by Manish Mimani (CEO) and Mohanraj Selvaraj (Head of Engineering)',
      },
      {
        label: 'Strategic advisor',
        value: 'Sunita Handa — former Chief General Manager, Digital, State Bank of India',
      },
      {
        label: 'Industry focus',
        value:
          'Almost exclusively BFSI: banks, NBFCs, insurance, capital markets, and government financial-services apps',
      },
      {
        label: 'Reference customers',
        value:
          'RBL Bank, Yes Bank, Bajaj Finserv, ICICI Lombard, LIC, BSE — and 20–25+ other Indian financial institutions',
      },
      {
        label: 'MEA distribution',
        value:
          'Strategic partnership with TechBridge Distribution MEA (announced October 2024) — UAE, KSA, Egypt, South Africa',
      },
      { label: 'Certifications', value: 'ISO 27001, PCI DSS, ISO 22301' },
      {
        label: 'Business model',
        value: 'Subscription per app + per-MAU bands; aggressively priced versus typical US/EU vendors',
      },
    ],
    architecture:
      'Protectt.ai delivers one integrated mobile-security platform with four tightly coupled modules. The customer ships one lightweight SDK and enables the modules they need. Everything reports into a single web dashboard, with REST and webhooks into the bank’s SIEM and fraud-management systems. The pitch: one vendor, one SDK, full mobile security for banking.',
    modules: [
      {
        name: 'AppProtectt',
        technical:
          'Runtime Application Self-Protection (RASP) with 100+ checks: hooking, root/jailbreak, emulator, repackaging, MITM, screen overlay, malicious accessibility abuse, and SMS-channel exploitation.',
        plainEnglish: 'The core guard inside the app — watches for hostile conditions and stops abuse in real time.',
      },
      {
        name: 'CodeProtectt',
        technical:
          'Multi-layer polymorphic obfuscation for Android (Java/Kotlin) and iOS (Swift/Objective-C), with key/string encryption and anti-decompilation.',
        plainEnglish:
          'Scrambles the app’s code so attackers cannot read it — and does it differently every build so last month’s research does not carry over.',
      },
      {
        name: 'AppBind',
        technical:
          'Cryptographic device and SIM binding using proprietary LSAP and SSiD technology, tied to a 3-Way Hairpin authentication protocol that operates without OTPs.',
        plainEnglish:
          'Locks the account to a verified phone and SIM. Stolen passwords are not enough from a new device — built to defeat SIM-swap fraud.',
      },
      {
        name: 'Fraud Risk Management',
        technical:
          'AI/ML behavioural anomaly engine with customisable rules, real-time dashboards, and tuning controls to keep false positives low.',
        plainEnglish: 'Learns normal behaviour per user and flags transactions that do not fit the pattern.',
      },
    ],
    keyFeatures: [
      '100+ deep-tech controls in AppProtectt — broad single-SDK coverage among the shortlist.',
      'Pre-mapped to RBI Digital Payment Security Controls, NPCI SIM/Device Binding, and SEBI Cyber Resilience Framework.',
      'AI-native behavioural fraud bundled into the platform — not a separate SKU.',
      'Lightweight SDK; Indian bank references cite minimal latency impact on transactions.',
      'Native Android, native iOS, React Native, Ionic.',
      'Cloud-side rule updates for many detections without an app-store release.',
    ],
    integration:
      'Customer development team adds the Protectt.ai SDK to their build configuration (Gradle for Android, CocoaPods/SPM for iOS), initialises the SDK with a customer-specific key on app start-up, and configures the modules they want via a server-side console. Typical reference engagements describe go-live in 4–8 weeks for a mid-tier bank, which is the fastest of the four vendors. Technieum delivers integration as a fixed-fee professional-services engagement.',
    strengths: [
      'Deepest BFSI regulatory mapping — compliance teams in Indian-managed UAE banks, exchange houses and insurance JVs find the documentation immediately familiar.',
      'Single-vendor coverage of RASP + obfuscation + device binding + AI fraud — so customers buy one contract instead of three, saving procurement and integration overhead.',
      'Aggressive commercial posture, especially via the TechBridge MEA channel — consistently the lowest TCO of the four for equivalent feature scope.',
      'Fastest time-to-go-live — material for tier-2 UAE banks behind the March 2026 deadline.',
      'AI/ML behavioural model is first-class, not bolted on — references including RBL, Yes Bank, Bajaj Finserv attest to operational stability.',
    ],
    limitations: [
      'Brand recognition outside India / MEA still maturing — global banks may default to Western names.',
      'Less coverage in major analyst reports (Gartner, Forrester, QKS) than the other three — hurts in RFPs that score on analyst standing.',
      "Global support model relies on partners (TechBridge MEA in our region); Technieum's managed wrap is the answer to multi-region 24×7 expectations.",
      'Not currently positioned as a transaction-signing vendor — for full PSD2-style dynamic linking, OneSpan or a hybrid stack is needed.',
    ],
    compliance: [
      'ISO 27001 certified.',
      'PCI DSS certified.',
      'ISO 22301 (business continuity) certified.',
      'Pre-mapped to RBI Digital Payment Security Controls, NPCI SIM / Device Binding, SEBI Cyber Resilience Framework.',
      "Cross-mappable to CBUAE 2025/3057 expectations via Technieum's evidence templates.",
    ],
    typicalCustomers: [
      'Indian-origin or India-influenced banks and NBFCs in UAE.',
      'Tier-2 / tier-3 GCC banks behind regulatory deadlines.',
      'Exchange houses with Indian leadership; capital-markets firms aligned to SEBI norms.',
      'Cost-sensitive, procurement-led buyers; greenfield fintechs wanting one integrated SKU.',
    ],
  },

  guardsquare: {
    sourceDoc: 'Technieum Course 2 — Vendor Deep-Dives (TECH-EDU-RASP-201), Ch. 3',
    snapshot: [
      {
        label: 'Headquarters',
        value: 'Leuven, Belgium — with offices in Boston, San Francisco, Munich, Ontario',
      },
      {
        label: 'Founded',
        value: '2014 — by Eric Lafortune (creator of the open-source ProGuard) and Heidi Rakels',
      },
      {
        label: 'Ownership',
        value: 'Backed by Battery Ventures (acquired 2019). Acquired Verimatrix XTD assets in 2025',
      },
      {
        label: 'Industry focus',
        value:
          'Multi-vertical — financial services, payments, gaming (Unity), retail, healthcare, telecoms, public sector',
      },
      {
        label: 'Scale',
        value: '975+ enterprise customers across 95+ countries; 4 billion+ downloads protected',
      },
      {
        label: 'Reference customers',
        value:
          'Customer names not publicly disclosed; references include a top-50 US bank, a leading Brazilian bank, a global mobile-payments provider, multiple major gaming studios',
      },
      {
        label: 'Open-source heritage',
        value:
          'ProGuard — the standard Android shrinker / obfuscator that ships with the Android build toolchain',
      },
      {
        label: 'Business model',
        value:
          'Annual subscription per protected app, tiered by platform (Android / iOS / both), build frequency and protection level. Premium pricing',
      },
    ],
    architecture:
      "Guardsquare's architecture is fundamentally different from the SDK-first approach. Their core products — DexGuard for Android and iXGuard for iOS — are compile-time tools. They plug into the customer's build pipeline and transform the compiled bytecode itself, embedding obfuscation and RASP checks deep inside the app's structure. Around the core hardening tools, Guardsquare provides ThreatCast (a real-time monitoring console), AppSweep (a free MAST tool), and App Attestation (server-side validation that an incoming API request is genuinely from the real, unmodified app).",
    modules: [
      {
        name: 'DexGuard',
        technical:
          'Compile-time multi-layered, polymorphic obfuscation, encryption and RASP for native and cross-platform Android applications. Includes anti-tamper, root and emulator detection, hook detection, repackaging detection, and Apple-Silicon-on-Mac detection.',
        plainEnglish:
          "The Android security craftsman. Takes the bank's already-built Android app and rewrites the inside of it to be unreadable to attackers — and rewrites it differently every release.",
      },
      {
        name: 'iXGuard',
        technical:
          'Compile-time multi-layered, polymorphic obfuscation, encryption and RASP for native (Swift / Objective-C) and cross-platform iOS applications.',
        plainEnglish: 'The iOS twin of DexGuard — same idea, applied to iPhone and iPad apps.',
      },
      {
        name: 'ThreatCast',
        technical:
          "Real-time mobile threat-monitoring console. Records RASP events from deployed apps, with webhook integration into the customer's SIEM / SOAR.",
        plainEnglish:
          "The dashboard the bank's security team watches to see what attacks are being blocked in the field.",
      },
      {
        name: 'AppSweep',
        technical:
          'Free static-analysis MAST tool — scans an app binary for vulnerabilities, compliance violations and missing protections.',
        plainEnglish:
          "Free first-look tool. Run it on the customer's app, show them what it finds, and you have a reason to talk about DexGuard / iXGuard.",
      },
      {
        name: 'App Attestation',
        technical:
          "Server-side capability that lets the bank's API confirm that the app making the request is the genuine, unmodified, RASP-protected app — not a repackaged clone or a script.",
        plainEnglish: "The API's bouncer. Refuses to serve clones, scripts or modified apps.",
      },
    ],
    keyFeatures: [
      'Polymorphic obfuscation across multiple dimensions — control flow, names, strings, resources — so every build is structurally unique.',
      'RASP checks themselves are obfuscated, meaning attackers cannot easily find and disable them with hooking.',
      'Cross-platform coverage including React Native, Flutter, Cordova, Ionic, and Unity (the dominant mobile-game engine).',
      "Guided Workflow integrates protection with the customer's build pipeline in less than a day — minimal disruption to developer ergonomics.",
      'ThreatCast webhook output flows directly into Splunk, QRadar, Sentinel and any other SIEM with HTTP endpoints.',
      'AppSweep free MAST tool is regularly used as a foot-in-the-door asset.',
    ],
    integration:
      "DexGuard and iXGuard plug into the build pipeline (Gradle plugin for Android, Xcode build phase for iOS). The customer specifies a configuration file describing which classes / methods to protect at which intensity. The tool then transforms the bytecode at build time. Because everything is done at compile time, runtime performance impact is normally negligible. ThreatCast is enabled by including a small reporting library and pointing it at the customer's ThreatCast tenant. App Attestation requires the customer to call a Guardsquare API from their own backend before processing sensitive requests.",
    strengths: [
      'Most aggressive code-hardening in the market — every build is structurally different, so attackers cannot reuse research from previous versions.',
      'Engineering credibility — the founder created the obfuscation technology that ships inside the Android operating system itself.',
      'Cleanest CI/CD ergonomics. Developers like working with it.',
      'Cross-platform breadth covers exotic stacks (Unity, Flutter) other vendors stretch to support.',
      'Free AppSweep MAST tool gives every Technieum AE a no-friction first conversation with engineering teams.',
    ],
    limitations: [
      'RASP scope is narrower than Zimperium MAPS or OneSpan — focused on hardening, anti-tamper, and threat reporting. No bundled fraud, no device binding, no transaction signing.',
      'Premium pricing — typically the most expensive of the four when fully deployed.',
      'Smaller UAE field organisation than OneSpan; engagement runs through partners like Technieum.',
      'QKS Group SPARK Matrix 2025 noted Guardsquare lacking some granular control / analytics; the Verimatrix XTD acquisition narrows that gap but the integrated story is still maturing.',
    ],
    compliance: [
      'Pre-mapped to OWASP MASVS.',
      'Aligned to PCI DSS and PSD2 SCA / dynamic-linking expectations.',
      'Customer use under MAS TRM, FFIEC, GDPR, HIPAA scopes.',
      'Cross-mappable to CBUAE 2025/3057 via templates.',
    ],
    typicalCustomers: [
      'Engineering-led customers (CTO and VP Engineering involved in the buying decision).',
      'Tier-1 banks where IP protection of the mobile app is a board-level concern.',
      'Mobile gaming and high-IP fintech.',
      'Payments SDK providers.',
      'Any organisation that has previously been victim to app cloning, repackaging or reverse-engineering attacks.',
    ],
  },

  zimperium: {
    sourceDoc: 'Technieum Course 2 — Vendor Deep-Dives (TECH-EDU-RASP-201), Ch. 4',
    snapshot: [
      { label: 'Headquarters', value: 'Dallas, Texas, USA' },
      { label: 'Founded', value: '2010 — co-founded by Zuk Avraham' },
      { label: 'Ownership', value: 'Backed by Liberty Strategic Capital and SoftBank' },
      {
        label: 'Industry focus',
        value:
          'Tier-1 financial services, US federal agencies (FedRAMP-authorised), healthcare, automotive, aviation, government, defence-adjacent',
      },
      {
        label: 'Reference scale',
        value:
          'Tier-1 banks across US, UK, Spain, Italy, India, MEA — plus federal agencies; the only Mobile Threat Defence vendor with FedRAMP authorisation',
      },
      {
        label: 'Research arm',
        value:
          'zLabs — among the most-cited mobile threat-intelligence teams globally; publishes the annual Banking Heist Report (2026 edition: 34 malware families, 1,243 institutions, 90 countries)',
      },
      {
        label: 'Recognition',
        value:
          'QKS Group SPARK Matrix In-App Protection Leader 2023, 2024 and 2025; multiple Cybersecurity Excellence awards',
      },
      {
        label: 'Business model',
        value:
          'Subscription per app + per-MAU bands; module-level SKUs (zScan / zShield / zDefend / zKeyBox) sold individually or as MAPS bundle. Pre-packaged PCI MPoC offering',
      },
    ],
    architecture:
      "Zimperium structures its mobile-security offering as a unified suite called MAPS — Mobile Application Protection Suite. MAPS comprises four modules (zScan, zShield, zDefend, zKeyBox) that cover the full app lifecycle — from pre-release scanning, through compile-time hardening, through runtime protection, into key protection — all reporting into a single zConsole management dashboard. Separately, Zimperium offers Mobile Threat Defense (MTD) products that protect employee devices, and the unique value comes from correlating in-app events (zDefend) with device-level events (MTD).",
    modules: [
      {
        name: 'zScan',
        technical:
          'Mobile Application Security Testing (MAST). Scans the compiled app binary before release for compliance, privacy and security vulnerabilities. Integrates into CI/CD.',
        plainEnglish:
          'The pre-flight checker. Examines the app before take-off and tells the developer what to fix.',
      },
      {
        name: 'zShield',
        technical:
          'Application hardening — obfuscation, encryption, anti-tampering. Available in two modes: low-code (compile-time integration with deep configuration) and no-code (post-compile binary wrapping for fast time-to-market).',
        plainEnglish:
          'The protective coating. Wraps the app in an outer layer that resists reverse engineering and tampering.',
      },
      {
        name: 'zDefend',
        technical:
          "RASP SDK. Embedded into the mobile app, providing real-time, on-device detection of device, network, phishing and malware threats — even without network connectivity. Supports over-the-air detection rule updates without an app-store re-release. Powered by Zimperium's z9 ML engine.",
        plainEnglish:
          'The active security guard. Watches everything happening around the app in real time and reacts in milliseconds.',
      },
      {
        name: 'zKeyBox',
        technical:
          'White-box cryptography. Protects encryption keys and secrets in such a way that they cannot be discovered, extracted or manipulated even if the attacker has full visibility into the running app.',
        plainEnglish:
          "The vault for secrets. Hides the bank's cryptographic keys inside maths rather than storing them anywhere readable.",
      },
      {
        name: 'zConsole',
        technical:
          'The central management dashboard for all of MAPS. Threat visibility, policy configuration, OTA rule updates, SIEM integration.',
        plainEnglish:
          'The mission-control room. One screen showing every threat across every deployed instance of the app.',
      },
      {
        name: 'MTD (separate product line)',
        technical:
          'Mobile Threat Defense — runs on individual devices to detect device, network, phishing and app-level threats across all apps on the device.',
        plainEnglish:
          'The bodyguard for the entire phone, not just one app. Sold separately but deployable alongside MAPS for correlated visibility.',
      },
    ],
    keyFeatures: [
      'Three-time-running QKS SPARK Matrix In-App Protection Leader (2023, 2024, 2025) — the strongest analyst credential among the four.',
      'Over-the-air detection rule updates — when a new malware family appears, Zimperium customers can push new rules to every installed app instance without an app-store re-release.',
      "z9 ML engine — Zimperium's on-device machine-learning model trained on the world's largest mobile-threat dataset.",
      'FedRAMP authorisation — the only mobile-security vendor with this US federal-government clearance, signalling to procurement teams that the vendor has passed deep security audit.',
      'Pre-packaged PCI MPoC bundle (zConsole + zShield + zDefend + zKeyBox) for SoftPOS / tap-on-phone customers.',
      'Native correlation between in-app (zDefend) and device-level (MTD) telemetry — unique among the four vendors.',
      'zLabs threat-intelligence research feed gives ongoing post-sale value.',
    ],
    integration:
      "zShield (compile-time mode) integrates into the customer's build pipeline; zShield (post-compile) wraps the already-built binary. zDefend is integrated as an SDK in the app source code. zKeyBox is integrated where keys are managed. zConsole is hosted by Zimperium (multi-tenant SaaS) or on-premises for highly regulated customers. Customers report integration as 'powerful but not plug-and-play' — Technieum should always include managed-integration professional services in deal scope.",
    strengths: [
      'Strongest analyst posture of the four vendors — three-time SPARK Leader.',
      'Over-the-air response capability is the single biggest operational differentiator versus competitors.',
      'z9 + zLabs combination provides best-in-class threat intelligence depth.',
      'FedRAMP credential is unique and decisive in regulated procurement.',
      'PCI MPoC pre-packaged offering is a clean answer for SoftPOS use cases.',
      "Native MTD + RASP correlation answers the increasingly-asked question: 'can my mobile-banking app see what is happening on the customer's phone?'",
    ],
    limitations: [
      'Higher list price than Protectt.ai and Guardsquare in many configurations.',
      'Integration complexity — zShield + zDefend together require real engineering effort. Plan a clear professional-services wrap.',
      'No native transaction signing — for combined RASP + transaction signing in one SKU, OneSpan competes more cleanly.',
      'zConsole has a meaningful learning curve; operational-readiness training should be in the deal.',
    ],
    compliance: [
      'FedRAMP Authority To Operate (US federal procurement).',
      'Aligned to PCI MPoC packaged offering.',
      'PSD2 / SCA, MAS TRM, SOC 2 Type II.',
      'Used by US healthcare under HIPAA and US federal under FISMA / FedRAMP.',
      'Cross-mappable to CBUAE 2025/3057 expectations via Technieum templates.',
    ],
    typicalCustomers: [
      'Tier-1 GCC and global banks with formal RFP processes.',
      'Payment service providers launching SoftPOS / tap-on-phone.',
      'Large enterprise mobility estates (employee-device security combined with customer-app security).',
      'Government, defence-adjacent, healthcare.',
      'Any customer for whom analyst leadership and threat-intelligence depth are decisive.',
    ],
  },

  onespan: {
    sourceDoc: 'Technieum Course 2 — Vendor Deep-Dives (TECH-EDU-RASP-201), Ch. 5',
    snapshot: [
      { label: 'Headquarters', value: 'Boston, Massachusetts, USA' },
      {
        label: 'History',
        value:
          'Founded 1991 as Vasco Data Security International. Rebranded to OneSpan in May 2018. Publicly traded on NASDAQ (ticker OSPN)',
      },
      { label: 'EMEA / international HQ', value: 'Dubai Silicon Oasis (UAE) — established in 2012' },
      {
        label: 'Industry focus',
        value:
          "Banking, financial services, healthcare, professional services. >10,000 customers globally. Used by more than 60% of the world's top-100 banks",
      },
      {
        label: 'Reference customers',
        value:
          'HSBC USA, BBVA, Rabobank, Arab Bank, Riyadh Bank, Raiffeisen Italy, Sumitomo Mitsui Trust Bank, Sony Bank, EagleBank, AGBank Azerbaijan, Bank of Montreal',
      },
      {
        label: 'Strategic moves',
        value:
          '2025–26: Acquired Nok Nok Labs (June 2025) for FIDO leadership; strategic investment in ThreatFabric (October 2025) for fraud intelligence; acquired Build38 (closed 2 March 2026) for next-generation SDK-based RASP',
      },
      {
        label: 'Standards body roles',
        value: 'OneSpan is a board member of the FIDO Alliance',
      },
      {
        label: 'Business model',
        value:
          'Subscription with module-level licensing. Customers normally buy a compliance-aligned bundle (e.g. PSD2, CBUAE 2025/3057)',
      },
    ],
    architecture:
      "OneSpan is best understood as a digital-trust platform, not a single-purpose product. It covers the full customer journey: identity verification, strong authentication, transaction signing, fraud detection, mobile app shielding and digital agreements. RASP (App Shielding, now augmented by Build38) is one important component of a broader platform. The architectural pitch to the customer is 'one trusted vendor for everything between the customer tapping login and the bank confirming the transaction'.",
    modules: [
      {
        name: 'App Shielding',
        technical:
          'RASP / mobile app protection — anti-tampering, reverse-engineering resistance, runtime threat detection, jailbreak / root detection, integrity verification. Enhanced by the March 2026 acquisition of Build38 (cloud-driven, AI-augmented next-generation RASP).',
        plainEnglish:
          "The security guard living inside the bank's app — now upgraded with cloud and AI back-up via Build38.",
      },
      {
        name: 'Mobile Security Suite (MSS)',
        technical:
          'A library of 17 SDKs covering biometrics, behavioural authentication, geolocation, jailbreak / root detection, device ID, secure storage, secure communication, FIDO and more.',
        plainEnglish:
          "A Lego-set of mobile-security building blocks. Developers pick the pieces they need and slot them into the bank's app.",
      },
      {
        name: 'Cronto',
        technical:
          "Patented transaction-signing technology. The bank displays a colourful image (a visual cryptogram) on the screen; the user's phone scans it, decodes the transaction details, and signs them. Available as a software SDK or as a hardware token (Digipass 7xx series).",
        plainEnglish:
          'The strongest possible defence against banking trojans — because the transaction details are encoded in the image, the user always sees the real amount and beneficiary, even if malware is rewriting the screen.',
      },
      {
        name: 'Digipass',
        technical:
          'Family of authenticator products — software (built into mobile apps) or hardware (one-button tokens). Generates one-time passwords or signs transactions.',
        plainEnglish:
          'The classic OneSpan brand. Many GCC banks already issue Digipass devices to corporate customers.',
      },
      {
        name: 'Mobile Authenticator Studio',
        technical:
          'A configurable platform for the bank to build its own branded authenticator app, combining OTP, multi-factor, FIDO and Cronto signing.',
        plainEnglish:
          'A toolkit that lets the bank ship a custom-branded authentication app without writing it from scratch.',
      },
      {
        name: 'Trusted Identity (TID) Platform',
        technical:
          "OneSpan's orchestration / risk-engine layer — combines authentication, fraud signals, device intelligence and adaptive policies into a single decision flow.",
        plainEnglish:
          'The brain that decides, transaction by transaction, how strict the security should be — based on the user, the device, the amount and the risk.',
      },
      {
        name: 'FIDO (post Nok Nok acquisition)',
        technical:
          "Native FIDO passwordless authentication using public-key cryptography on the user's device. Defeats phishing and credential theft.",
        plainEnglish: 'Modern passwordless login — what banks are increasingly required to offer.',
      },
    ],
    keyFeatures: [
      'Cronto transaction signing — the longest-running, regulator-recognised answer to PSD2 dynamic linking and equivalent in other markets.',
      'FIDO leadership — OneSpan sits on the FIDO Alliance Board and now owns Nok Nok Labs, one of the original FIDO authenticator pioneers.',
      'Build38-augmented App Shielding — closes the historical RASP-depth gap versus Zimperium and brings cloud-driven, AI-augmented next-gen RASP into the OneSpan stack.',
      'Deepest UAE field presence of the four vendors — international HQ in Dubai Silicon Oasis since 2012.',
      'Single-vendor coverage of authentication + signing + app shielding + FIDO + fraud signals via TID — uniquely broad among the shortlist.',
      'Bundled compliance evidence packages and customer-precedent case studies (NewB, Raiffeisen Italy, Sony Bank).',
    ],
    integration:
      "Customers most often start by deploying the Mobile Security Suite SDKs and / or Mobile Authenticator Studio. App Shielding is configured through the OneSpan tooling (low-code) and applied during build. Cronto signing is added via the MSS SDK. Build38 SDK adds the next-generation RASP layer. TID is hosted by OneSpan (cloud) or on-premises for sensitive deployments. Many UAE customers already have a Digipass / Cronto contract and add app shielding as a contract addendum rather than a new procurement cycle.",
    strengths: [
      'Unmatched UAE / GCC presence — many tier-1 banks already run Digipass / Cronto, making App Shielding an easy upsell.',
      'Best-fit vendor for transaction-signing-led use cases — Cronto is the regulator-recognised gold standard.',
      'Vendor-longevity story — public NASDAQ company, consistent acquirer (Cronto, Silanis, Dealflo, Nok Nok, Build38), strong financial profile.',
      'Build38 acquisition (March 2026) closes the historical RASP-depth gap.',
      "Bundled compliance evidence and prior-banking precedent reduce the customer's audit-prep burden.",
    ],
    limitations: [
      'Pre-Build38 App Shielding alone was generally regarded as solid but not best-of-breed in raw RASP depth — until the Build38 integration is GA-stable, technical buyers may probe.',
      'RASP is one component of many; for customers who want a vendor singularly focused on mobile in-app protection, Guardsquare or Zimperium feel more product-aligned.',
      'Premium pricing for the integrated suite. Customers buying RASP only — without authentication / signing — can find lower TCO elsewhere.',
      "The transaction-signing legacy can lead some customers to perceive OneSpan as 'authentication only'; lead with App Shielding + Build38 in RASP-first conversations.",
    ],
    compliance: [
      'PSD2 Strong Customer Authentication and Dynamic Linking — long-running reference customer base.',
      'FFIEC, PCI DSS, GDPR, SAMA, MAS TRM cross-mappings.',
      'FIDO Alliance certification (board member, Nok Nok-derived solutions).',
      'SOC 2 Type II.',
      'Cross-mappable to CBUAE 2025/3057 with deep prior-banking precedent.',
    ],
    typicalCustomers: [
      'Tier-1 GCC and global banks with strict vendor-risk and longevity criteria.',
      'Existing OneSpan Digipass / Cronto customers.',
      'Payment service providers needing FIDO + transaction signing + RASP from one vendor.',
      'Banks preparing for CBUAE inspection or regulator-led audit.',
      'Institutions concerned about RASP-vendor M&A churn.',
    ],
  },
};
