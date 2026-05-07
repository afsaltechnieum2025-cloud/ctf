import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const learningOutcomes = [
  'Explain why mobile apps need different security than web apps.',
  'Define core terms used by customers and vendors (RASP, SDK, obfuscation, hooking, jailbreak/root, MITM, SSL pinning, FIDO, device binding, and more).',
  'Describe common mobile attack flows in plain business language.',
  'Map defenses to the five layers of mobile RASP.',
  'Position RASP correctly next to WAF, MTD, and MAST.',
  'List regulations driving RASP adoption, especially CBUAE Notice 2025/3057 and the 2025 CBUAE law context.',
  'Use a 10-point checklist to evaluate RASP vendors.',
];

const studyTip =
  'Do not skip definitions. The course emphasizes that most customer questions hinge on term clarity.';

const mobileRealities = [
  'Reality 1.Apps are downloaded onto unmanaged devices the bank does not own.',
  'Reality 2.The app binary itself is on the attacker’s phone, available for them to take apart, study, modify and re-publish.',
  'Reality 3.The phone might be rooted, jailbroken, emulated, or running malware specifically designed to abuse banking apps.',
  'Reality 4.Authentication codes sent over SMS or email can be intercepted via SIM swap, phishing, or device-side malware — they are no longer trustworthy.',
  'Reality 5.Once an attacker controls the device, server-side fraud detection alone can no longer tell the difference between a legitimate session and a hijacked one — because everything looks identical from the server’s perspective.',
];

const glossary = [
  [
    'Accessibility Service',
    'A built-in Android feature designed to help users with disabilities. Malicious apps abuse it to read what is on the screen, capture what the user types, and click buttons on the user’s behalf.',
  ],
  [
    'Anti-Tampering',
    'Protection that detects whether the app’s code or files have been changed by an attacker — and refuses to run if they have.',
  ],
  [
    'API',
    'Application Programming Interface — the set of rules that lets two programs talk to each other. The bank’s mobile app talks to the bank’s servers via APIs.',
  ],
  [
    'App Hardening',
    'An umbrella term for everything that makes an app more resistant to attack — obfuscation, anti-tampering, environment integrity checks, and so on.',
  ],
  ['App Shielding', 'Another name for app hardening + RASP, used especially by OneSpan.'],
  ['Biometrics', 'Authentication using physical traits — fingerprint, face, iris, voice.'],
  [
    'CI/CD Pipeline',
    'Continuous Integration / Continuous Delivery — the automated factory line that builds, tests and ships the app every time a developer commits new code. RASP tools that integrate cleanly into the CI/CD pipeline win engineering hearts.',
  ],
  ['Code Injection', 'An attack where the attacker forces extra, malicious code into a running app.'],
  [
    'Code Obfuscation',
    'Deliberately scrambling the app’s code so that even when an attacker decompiles it, they cannot read what it does. Polymorphic obfuscation goes further: every build of the app is scrambled differently.',
  ],
  [
    'Cronto',
    'A patented OneSpan technology for transaction signing. The bank shows a colourful image (a “visual cryptogram”) on the screen; the user’s phone scans the image and decodes the transaction details, allowing the user to sign them. Defeats man-in-the-browser attacks because the data is encoded in the image, not the text.',
  ],
  [
    'Decompilation',
    'Reversing a compiled app back into something close to its original source code — often the first step in any reverse-engineering attack.',
  ],
  [
    'Device Binding',
    'Cryptographically tying a user’s account to a specific physical device, so that the account cannot be used from any other device without re-enrolment.',
  ],
  [
    'Device Fingerprinting',
    'Recognising a specific device by combining many small attributes — model, OS version, screen size, language, timezone — into a unique fingerprint.',
  ],
  [
    'Digipass',
    'OneSpan’s family of authenticator products. Available as hardware tokens or as software running inside a mobile app.',
  ],
  [
    'Dynamic Linking',
    'A PSD2 requirement: the authentication code must be unique to the specific transaction’s amount and beneficiary, so a code captured for one transaction cannot be reused for a different one.',
  ],
  [
    'Emulator',
    'Software that pretends to be a physical phone. Attackers use emulators to study and modify apps in a controlled environment. RASP detects emulators and refuses to run.',
  ],
  [
    'FIDO',
    'Fast Identity Online — a global standard for passwordless authentication based on cryptographic keys held on the user’s device. Defeats phishing because the secret never leaves the device.',
  ],
  [
    'Frida',
    'An open-source toolkit attackers use to attach to a running app and modify its behaviour live (this is called “hooking”). The single most common tool seen in mobile penetration testing.',
  ],
  [
    'Hooking',
    'Intercepting a function call inside a running app — for example, replacing the function that checks “is the device rooted?” with a function that always says “no”.',
  ],
  [
    'Jailbreaking (iOS) / Rooting (Android)',
    'Removing the manufacturer’s restrictions on a phone, granting the user (and any app on the phone) full administrative access. Common precondition for many attacks.',
  ],
  [
    'MAST',
    'Mobile Application Security Testing — automated scanning of a mobile app to find vulnerabilities before release. Examples: Guardsquare AppSweep, Zimperium zScan.',
  ],
  [
    'MITM',
    'Man-in-the-Middle — an attacker positioning themselves between the app and the bank’s server, secretly reading or modifying the traffic in transit.',
  ],
  [
    'Mobile Threat Defense (MTD)',
    'Protection that runs on the device itself and watches for threats across all apps, not just one — for example, detecting that the phone is infected with banking malware. Different from RASP, which lives inside one specific app.',
  ],
  [
    'OTP',
    'One-Time Password — a temporary code sent over SMS, email, push or generated by an authenticator app. SMS-based OTPs are being phased out worldwide because they can be intercepted.',
  ],
  [
    'OTA Update',
    'Over-The-Air update — refreshing something on the device without the user having to download a new version from the app store. Some RASP tools (Zimperium zDefend in particular) push new detection rules over the air.',
  ],
  [
    'Polymorphic Obfuscation',
    'Obfuscation that scrambles the code differently every single build, so attackers cannot reuse anything they learned from a previous version.',
  ],
  [
    'Push Authentication',
    'The bank sends a push notification to the user’s mobile app; the user taps to approve. Replaces SMS OTPs because the approval happens inside the bank’s own, hardened app.',
  ],
  [
    'RASP',
    'Runtime Application Self-Protection — security code that lives inside the running app and watches the environment around it for signs of attack, responding in real time. The subject of this entire course.',
  ],
  [
    'Repackaging',
    'Disassembling a legitimate app, modifying its code (often to add malware), and republishing it as a fake version. RASP detects repackaged apps and refuses to run them.',
  ],
  [
    'Reverse Engineering',
    'Taking apart a finished app to figure out how it works — usually as a step before modifying or cloning it.',
  ],
  [
    'SDK',
    'Software Development Kit — a pre-built library that developers drop into their app to add a feature. RASP is most often delivered as an SDK that the bank’s developers integrate into their banking app.',
  ],
  [
    'SIM Binding',
    'Cryptographically linking the user’s account to the specific SIM card in their phone, so a SIM swap attack cannot move the account to a new SIM.',
  ],
  [
    'SIM Swap',
    'An attack where the criminal convinces the mobile operator to transfer the victim’s phone number to a new SIM card under the attacker’s control. Defeats any security that relies on the phone number alone — including SMS OTPs.',
  ],
  [
    'SSL Pinning',
    'The mobile app refuses to talk to any server unless the server presents a specific, expected security certificate. Defeats man-in-the-middle attacks where an attacker tries to substitute their own fake certificate.',
  ],
  [
    'Static Analysis vs Dynamic Analysis',
    'Static = looking at the app’s code while it is not running (e.g. decompilation). Dynamic = watching and modifying the app while it runs (e.g. hooking with Frida). Good app security defends against both.',
  ],
  [
    'Transaction Signing',
    'The user has to authorise each individual transaction with a unique signature, rather than authenticating once and trusting everything for the rest of the session. The strongest defence against banking trojans.',
  ],
  [
    'WAF',
    'Web Application Firewall — protects web applications by sitting in front of the bank’s server and filtering out malicious requests. Does NOT protect mobile apps installed on customer devices.',
  ],
  [
    'White-box Cryptography',
    'Encryption keys that remain protected even if an attacker has full visibility into the running app — by hiding the key inside obfuscated maths rather than storing it as a value. Essential for keys that must live inside a mobile app.',
  ],
];

const integrationRows = [
  [
    'Compile-time integration',
    'The vendor’s tool is plugged into the bank’s build process. Every time the developer compiles the app, the tool re-writes the compiled bytecode to add protections. Example: Guardsquare DexGuard / iXGuard.',
    'Strongest, most aggressive option. Protections are baked deeply into the app and are very hard for an attacker to strip out. Requires changes to the build pipeline.',
  ],
  [
    'SDK integration',
    'The vendor ships a software library (an SDK). The bank’s developers add a few lines of code to plug the SDK into the app. The SDK then runs alongside the rest of the app. Example: Zimperium zDefend, Protectt.ai AppProtectt.',
    'Most flexible. Works with most build setups. Requires developer effort, but less invasive than compile-time. Most vendors offer this as their primary integration mode.',
  ],
  [
    'Binary wrapping (no-code)',
    'The vendor takes the already-compiled app file and wraps it with a layer of protection. The developer doesn’t change a single line of code. Example: Zimperium zShield no-code mode.',
    'Fastest to deploy. Useful when the app team has no time or no source-code access. Generally less deep than compile-time or SDK approaches.',
  ],
];

const raspContinuousLoop = [
  'Detects.Watches the environment around the app — is the phone rooted, jailbroken, emulated, or running a known hooking tool?',
  'Validates integrity.Watches the app itself — has the code been tampered with, repackaged, or are unauthorised libraries hooking into it?',
  'Responds.Reacts — depending on configuration, the app can warn the user, stop a transaction, terminate the session, alert the bank’s servers, downgrade functionality, or simply refuse to run.',
];

const attackPatterns = [
  {
    name: '4.1 Attack Pattern A — Static Reverse Engineering',
    steps: [
      'Step 1.Attacker downloads the bank’s app from the Play Store.',
      'Step 2.Attacker decompiles the app to recover something close to its source code.',
      'Step 3.Attacker reads the code to find weaknesses — hard-coded API keys, weak crypto, business-logic flaws.',
      'Step 4.Attacker exploits those weaknesses against the live banking system.',
    ],
    defense:
      'code obfuscation (especially polymorphic), anti-tampering, white-box cryptography for any keys that must live inside the app.',
  },
  {
    name: '4.2 Attack Pattern B — Dynamic Hooking',
    steps: [
      'Step 1.Attacker installs the bank’s app on a rooted phone or emulator.',
      'Step 2.Attacker attaches Frida (or a similar tool) to the running app.',
      'Step 3.Attacker hooks specific functions inside the app — for example, the function that checks whether the device is rooted — and forces them to return false answers.',
      'Step 4.With protections disabled, the attacker now has free access to the app’s internals and can extract secrets or modify behaviour.',
    ],
    defense:
      'RASP that detects rooting, jailbreaking, emulators and hooking frameworks at runtime — combined with obfuscation that hides the RASP checks themselves so attackers cannot easily locate them.',
  },
  {
    name: '4.3 Attack Pattern C — Banking Trojan with Overlay & Accessibility Abuse',
    steps: [
      'Step 1.Victim is tricked into installing a malicious app (often disguised as a utility, a delivery-tracking app, or a fake Google Play update).',
      'Step 2.The malicious app asks for Accessibility Services permission. The victim grants it.',
      'Step 3.When the victim opens their banking app, the trojan draws a fake login screen on top of the real one (this is called an “overlay attack”).',
      'Step 4.The trojan captures the credentials and uses Accessibility Services to automate transactions inside the real banking app, even intercepting OTPs.',
    ],
    defense:
      'RASP that detects overlay attacks and Accessibility-Service abuse + Mobile Threat Defense that flags the malicious companion app + in-app transaction signing that requires explicit per-transaction approval.',
  },
  {
    name: '4.4 Attack Pattern D — SIM Swap',
    steps: [
      'Step 1.Attacker calls the mobile operator pretending to be the victim, claiming a lost SIM, and convinces the operator to issue a new SIM with the victim’s phone number.',
      'Step 2.Attacker requests an SMS OTP for the victim’s online banking. The OTP now arrives on the attacker’s SIM, not the victim’s.',
      'Step 3.Attacker logs in and drains the account.',
    ],
    defense:
      'stop relying on SMS OTPs (the entire point of CBUAE Notice 2025/3057). Replace with in-app push approvals + device binding + SIM binding so a new SIM cannot be used to take over the account.',
  },
];

const ruleOfThumb =
  'Compile-time = deepest, SDK = most flexible, no-code wrapping = fastest. Enterprise programs often combine SDK-first integration with deeper hardening where needed.';

const layerRows = [
  [
    '1. Code Hardening',
    'Make the app’s code unreadable. Obfuscation, encryption of strings and resources, control-flow flattening, polymorphic builds.',
    'Defeats: static reverse engineering, IP theft, cloning.',
  ],
  [
    '2. Anti-Tampering & Integrity',
    'Continuously verify the app has not been modified. Repackaging detection, code-signature checks, library-integrity verification.',
    'Defeats: repackaged-app attacks, malicious clones, code injection.',
  ],
  [
    '3. Environment Integrity',
    'Detect hostile execution environments. Root / jailbreak detection, emulator detection, virtualisation detection, malicious app overlay detection, Accessibility-Service abuse detection.',
    'Defeats: dynamic analysis, banking trojans, overlay attacks.',
  ],
  [
    '4. Network Trust',
    'Verify the app is talking to the real bank server, not an impostor. SSL pinning, MITM detection.',
    'Defeats: man-in-the-middle attacks, traffic interception.',
  ],
  [
    '5. Cryptographic Key Protection',
    'Keep secrets safe even on a hostile device. White-box cryptography, hardware-backed key stores, secure enclaves.',
    'Defeats: extraction of API keys, account credentials, payment secrets.',
  ],
];

const examPoint =
  'When a customer asks ‘what does RASP actually protect against?’, walk them through these five layers. Every objection a customer can raise will fit into one of these layers.';

const compareRows = [
  [
    'WAF — Web Application Firewall',
    'Sits in front of the bank’s server and filters HTTP traffic.',
    'Web applications and APIs.',
    'Cannot see anything that happens inside a mobile app on a customer device.',
  ],
  [
    'RASP — Runtime Application Self-Protection',
    'Lives inside the mobile app and watches the environment in real time.',
    'Mobile apps installed on customer devices.',
    'Cannot see threats outside the app — for that you need MTD.',
  ],
  [
    'MTD — Mobile Threat Defense',
    'Lives on the device and watches all apps and network connections, not just one.',
    'Employee phones, BYOD estates, and increasingly customer-facing risk telemetry.',
    'Doesn’t protect a specific app from being reverse-engineered — for that you need RASP.',
  ],
  [
    'MAST — Mobile Application Security Testing',
    'A pre-release scanner that finds vulnerabilities in the app’s code before it ships.',
    'Development teams during the build process.',
    'It is a testing tool, not a runtime defence — finding the bug is not the same as blocking the attack.',
  ],
];

const oneLiner =
  'WAF protects your servers. RASP protects your app. MTD protects the device. MAST tests the app before release. You need all four to call yourself comprehensively defended.';

const compliancePoints = [
  'Notice CBUAE/FCMCP/2025/3057 (issued 23 May 2025) — prohibits SMS / email OTPs and static passwords as the sole authentication mechanism for login, transaction confirmation and other sensitive operations.',
  'Deadline: 31 March 2026. UAE banks, finance companies, exchange houses, insurers and payment service providers must all complete the transition by this date.',
  'Federal Decree-Law No. 6 of 2025 (the New CBUAE Law) — in force from 16 September 2025 — consolidates banking, insurance and payments regulation; raises maximum fines for serious breaches to AED 1 billion; and imposes positive obligations on Licensed Financial Institutions to operate robust fraud-prevention systems.',
  'CBUAE November 2025 directive — prohibits use of consumer messaging platforms (WhatsApp, Telegram) for customer transactions, pushing all sensitive communication into the bank’s controlled mobile channel.',
  'CBUAE February 2026 AI guidelines — board-level accountability for AI / ML models, explainability, fairness, consumer protection.',
];

const regulatorReferences = [
  'RBI / NPCI / SEBI (India). Reserve Bank of India — Master Direction on Digital Payment Security Controls, NPCI SIM/Device Binding, SEBI Cyber Resilience Framework. Heavily referenced by Indian-managed UAE entities.',
  'SAMA (KSA). Saudi Arabia’s central bank — its own Cyber Security Framework with strong mobile-security expectations, especially after major fraud events in the KSA banking sector.',
  'PSD2 (Europe). Payment Services Directive 2 — established Strong Customer Authentication and Dynamic Linking. Although European, it is the blueprint many other regulators (including CBUAE) draw from.',
  'MAS TRM (Singapore). Singapore’s Technology Risk Management guidelines — strong mobile-banking security requirements, often referenced by global banks.',
  'PCI MPoC (Global). Payment Card Industry Mobile Payments on COTS — the certification standard for using a mobile phone to accept card payments (SoftPOS, tap-on-phone). Mandates RASP, white-box cryptography, MAST.',
];

const whyThisMatters =
  'Customers don’t buy RASP because they like RASP — they buy it because their regulator demands it, or because their auditors have flagged it. Your job is to translate the regulator’s language into the right vendor recommendation.';

const vendorChecklistRows = [
  [
    '1. Coverage',
    'Does the vendor cover all five RASP layers (Code Hardening, Anti-Tampering, Environment Integrity, Network Trust, Key Protection)?',
  ],
  [
    '2. Platform breadth',
    'Native Android (Java/Kotlin) and iOS (Swift/Objective-C) — plus React Native, Flutter, Cordova/Ionic, and (where relevant) Unity for game-style apps.',
  ],
  [
    '3. Integration model',
    'Compile-time, SDK, or no-code wrapping — and how cleanly each fits the bank’s existing CI/CD pipeline.',
  ],
  [
    '4. Performance impact',
    'What is the measurable impact on app size, startup time, and runtime responsiveness? Run a benchmark in the POC.',
  ],
  [
    '5. OTA updates',
    'Can detection rules be updated without releasing a new app-store build? Critical for incident response.',
  ],
  [
    '6. Telemetry & SIEM integration',
    'Does the vendor’s console feed events into the bank’s SIEM/SOAR via webhook, syslog, or REST API?',
  ],
  [
    '7. Compliance evidence',
    'Does the vendor provide pre-packaged evidence templates for CBUAE, PCI, PSD2, RBI, etc.?',
  ],
  [
    '8. Bundled value',
    'Does it bring extras — fraud telemetry, device binding, transaction signing, FIDO — or is it RASP-only?',
  ],
  [
    '9. Vendor stability',
    'Public company / institutional backing / acquisition history. Is the customer comfortable with the vendor’s longevity?',
  ],
  [
    '10. Regional support',
    'Does the vendor have local support / SE coverage in the UAE? If not, who fills the gap? (Usually Technieum.)',
  ],
];

const selfCheck = [
  'Why mobile apps cannot be defended by a WAF alone.',
  'What an SDK is and how vendors use it to deliver RASP.',
  'What jailbreaking, rooting, hooking, and Frida have in common.',
  'Why polymorphic obfuscation matters more than ordinary obfuscation.',
  'How a banking trojan combines overlay + accessibility abuse + hooking to take over a session.',
  'Why SMS OTP is no longer trustworthy and what is replacing it.',
  'The difference between RASP, MTD, WAF and MAST in one sentence each.',
  'The CBUAE deadline and the notice number that drives it.',
  'The five layers of RASP defence and one example threat each layer defeats.',
  'The 10-point vendor evaluation checklist.',
];

const readinessNote =
  'If you can answer all of the following confidently, you are ready for Course 2 (Vendor Product Deep-Dives). If any are shaky, return to that module before advancing.';

function ModuleCard({
  moduleId,
  title,
  children,
}: {
  moduleId: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/40 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {moduleId}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6 text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

export default function RaspFoundationContent() {
  return (
    <article className="mt-2 space-y-6">
      <ModuleCard moduleId="Course 1" title="RASP Foundation — Learning outcomes">
        <ul className="list-disc space-y-2 pl-5">
          {learningOutcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Study tip:</span> {studyTip}
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 1" title="Mobile App Security: The Basics">
        <p className="font-medium text-foreground">1.1 Why Mobile Apps Are a Special Security Problem</p>
        <p>
          When a bank deploys a website, the website lives on the bank’s own servers, behind the bank’s own
          firewalls, watched by the bank’s own monitoring tools. If something looks suspicious, the bank can simply
          block the user. Web security is, broadly speaking, a perimeter problem.
        </p>
        <p>
          Mobile is the opposite. The bank’s mobile app gets installed on the customer’s personal device — a phone
          the bank does not own, cannot inspect, and has no control over. The phone might be jailbroken, infected
          with malware, running inside an emulator, or controlled by a remote attacker. The app has to take care of
          itself out there in hostile territory. That is the unique challenge of mobile security.
        </p>
        <p className="font-medium text-foreground">1.2 The Five Realities of Mobile That Drive Everything Else</p>
        <ul className="list-disc space-y-2 pl-5">
          {mobileRealities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold uppercase tracking-wide">BIG IDEA</span>
          <p className="mt-2">
            If the bank cannot control the customer’s phone, the app must defend itself. That self-defending
            behaviour is exactly what RASP delivers.
          </p>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 2" title="Glossary: Every Term, Plain English">
        <p>
          Definitions in alphabetical order. Read each one until you can repeat it from memory. These are the
          words that come up in every customer meeting.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Term</th>
                <th className="px-4 py-3 font-semibold text-foreground">Definition</th>
              </tr>
            </thead>
            <tbody>
              {glossary.map(([term, definition]) => (
                <tr key={term} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{term}</td>
                  <td className="px-4 py-3">{definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 3" title="What is RASP?">
        <p className="font-medium text-foreground">3.1 The Definition</p>
        <p>
          Runtime Application Self-Protection — RASP — is security code that lives inside the running mobile
          application. It watches the environment around the app for signs of attack and reacts in real time. Where
          a firewall is essentially a security guard at a building entrance, RASP is the security guard who travels
          everywhere with you, inside your pocket.
        </p>
        <p className="font-medium text-foreground">3.2 The Three Things RASP Does Continuously</p>
        <ul className="list-disc space-y-2 pl-5">
          {raspContinuousLoop.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="font-medium text-foreground">3.3 How RASP Gets Inside the App</p>
        <p>There are three common ways a vendor delivers RASP into the bank’s mobile app:</p>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Approach</th>
                <th className="px-4 py-3 font-semibold text-foreground">What it means</th>
                <th className="px-4 py-3 font-semibold text-foreground">Trade-off</th>
              </tr>
            </thead>
            <tbody>
              {integrationRows.map(([approach, meaning, tradeoff]) => (
                <tr key={approach} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{approach}</td>
                  <td className="px-4 py-3">{meaning}</td>
                  <td className="px-4 py-3">{tradeoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold uppercase tracking-wide">RULE OF THUMB</span>
          <p className="mt-2">{ruleOfThumb}</p>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 4" title="The Anatomy of a Mobile Attack">
        <p>
          If you can describe how an attack actually works, customers trust you. Here are the four most common
          attack patterns against mobile banking apps, explained step by step.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {attackPatterns.map((pattern) => (
            <Card key={pattern.name} className="border-border/60 bg-background/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{pattern.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1.5 pl-5">
                  {pattern.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <p>
                  <span className="font-semibold text-foreground">Defence:</span> {pattern.defense}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 5" title="Five layers of RASP defense">
        <p>
          Every mature RASP product, regardless of vendor, defends across the same five layers. Memorise these
          — they are the structure of every customer conversation about RASP capabilities.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Layer</th>
                <th className="px-4 py-3 font-semibold text-foreground">What it does</th>
                <th className="px-4 py-3 font-semibold text-foreground">What it defeats</th>
              </tr>
            </thead>
            <tbody>
              {layerRows.map(([layer, does, defeats]) => (
                <tr key={layer} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{layer}</td>
                  <td className="px-4 py-3">{does}</td>
                  <td className="px-4 py-3">{defeats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold uppercase tracking-wide">EXAM POINT</span>
          <p className="mt-2">{examPoint}</p>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 6" title="RASP vs WAF vs MTD vs MAST">
        <p>
          These four acronyms are constantly mixed up — by customers, by junior reps, even by some vendors.
          They all do different things and all four are normally needed in a serious banking environment.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Tool</th>
                <th className="px-4 py-3 font-semibold text-foreground">Where it lives</th>
                <th className="px-4 py-3 font-semibold text-foreground">What it protects</th>
                <th className="px-4 py-3 font-semibold text-foreground">Where it stops</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map(([tool, lives, protects, stops]) => (
                <tr key={tool} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{tool}</td>
                  <td className="px-4 py-3">{lives}</td>
                  <td className="px-4 py-3">{protects}</td>
                  <td className="px-4 py-3">{stops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold uppercase tracking-wide">ONE-LINER FOR CUSTOMERS</span>
          <p className="mt-2">‘{oneLiner}’</p>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 7" title="Compliance landscape">
        <p className="font-medium text-foreground">7.1 CBUAE — The Regulator Driving the UAE Conversation</p>
        <ul className="list-disc space-y-2 pl-5">
          {compliancePoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="font-medium text-foreground">7.2 Other Regulators You Will Hear In Customer Conversations</p>
        <ul className="list-disc space-y-2 pl-5">
          {regulatorReferences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold uppercase tracking-wide">WHY THIS MATTERS</span>
          <p className="mt-2">{whyThisMatters}</p>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 8" title="Vendor evaluation — 10-point checklist">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Checklist item</th>
                <th className="px-4 py-3 font-semibold text-foreground">What to verify</th>
              </tr>
            </thead>
            <tbody>
              {vendorChecklistRows.map(([item, verify]) => (
                <tr key={item} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">{item}</td>
                  <td className="px-4 py-3">{verify}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      <ModuleCard moduleId="Module 9" title="Self-check before moving to vendor deep-dives">
        <p>{readinessNote}</p>
        <ul className="list-disc space-y-2 pl-5">
          {selfCheck.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ModuleCard>

    </article>
  );
}
