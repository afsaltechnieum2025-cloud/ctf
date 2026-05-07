-- =============================================================================
-- Course learning tables + RASP topic seed for technieum_ctf
-- Matches backend/routes/learning.js (products, course_topics, sections, links, quiz).
-- Run in MySQL / MariaDB (e.g. phpMyAdmin, MySQL Workbench, or CLI):
--   mysql -u root -p technieum_ctf < backend/sql/seed_course_rasp.sql
-- Safe to re-run: removes previous rows for slug `rasp` only; upserts 4 products by slug.
-- After import: restart the API and open /courses (logged in). `quiz_attempts` powers quiz score tracking.
-- To refresh quiz INSERTs from TS: run `node backend/scripts/generate-rasp-quiz-sql.mjs`
-- (writes UTF-8 fragment; paste into this file under the course_topic_quiz_questions INSERT).
-- =============================================================================

USE `technieum_ctf`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Tables (IF NOT EXISTS — skip if you already created them elsewhere)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(512) NOT NULL,
  `image` varchar(512) DEFAULT NULL,
  `description` text NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_topics` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) NOT NULL,
  `title` varchar(512) NOT NULL,
  `tagline` text NOT NULL,
  `summary` text NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_topics_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_topic_sections` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int unsigned NOT NULL,
  `heading` varchar(512) NOT NULL,
  `paragraphs` json NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_course_topic_sections_topic` (`topic_id`),
  CONSTRAINT `fk_cts_topic` FOREIGN KEY (`topic_id`) REFERENCES `course_topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_topic_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ctp_topic_product` (`topic_id`, `product_id`),
  KEY `idx_ctp_topic` (`topic_id`),
  KEY `idx_ctp_product` (`product_id`),
  CONSTRAINT `fk_ctp_topic` FOREIGN KEY (`topic_id`) REFERENCES `course_topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_topic_quiz_questions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int unsigned NOT NULL,
  `question` text NOT NULL,
  `options` json NOT NULL,
  `correct_index` tinyint unsigned NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ctqq_topic` (`topic_id`),
  CONSTRAINT `fk_ctqq_topic` FOREIGN KEY (`topic_id`) REFERENCES `course_topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz completions (POST /api/quiz-attempts, admin report GET /api/quiz-attempts/admin/overview)
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `quiz_type` enum('product_mcq','course_topic_quiz') NOT NULL,
  `subject_slug` varchar(191) NOT NULL,
  `score_correct` smallint unsigned NOT NULL,
  `score_total` smallint unsigned NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_attempts_user` (`user_id`),
  KEY `idx_quiz_attempts_type_time` (`quiz_type`, `completed_at`),
  CONSTRAINT `fk_quiz_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Products linked from RASP (upsert by slug)
-- ---------------------------------------------------------------------------

INSERT INTO `products` (`slug`, `name`, `url`, `image`, `description`, `sort_order`) VALUES
(
  'protectt-ai',
  'Protectt.ai',
  'https://www.protectt.ai/',
  NULL,
  'Protectt.ai focuses on protecting live applications—especially on mobile—where attackers tamper with binaries, hook APIs, or abuse runtime behavior. Teams use it to harden releases, detect cloning and fraud patterns, and gather telemetry when apps run in hostile environments. It complements traditional scanning by addressing what happens after the app ships to real users.',
  0
),
(
  'guardsquare',
  'Guardsquare',
  'https://www.guardsquare.com/',
  NULL,
  'Guardsquare is best known for mobile app protection and hardening: DexGuard for Android, iXGuard for iOS, plus ThreatCast for post-release threat visibility and AppSweep for developer-side static checks. It extends the open-source ProGuard lineage into enterprise-grade obfuscation, anti-tampering, and runtime-aware defenses when high-value apps face reverse engineering and abuse in the wild.',
  1
),
(
  'zimperium',
  'Zimperium',
  'https://www.zimperium.com/',
  NULL,
  'Zimperium delivers mobile-first application protection under its MAPS (Mobile Application Protection Suite) story: on-device RASP (for example zDefend), hardening such as zShield, and cryptographic key protection with zKeyBox. It targets banks, fintech, and large consumer apps that need continuous runtime integrity, hooking detection, and analyst-recognized depth—not only pre-release scans.',
  2
),
(
  'onespan',
  'OneSpan',
  'https://www.onespan.com/',
  NULL,
  'OneSpan (formerly Vasco Data Security) combines strong customer authentication, fraud signals, and application shielding—including mobile hardening lines such as Build38—so regulated industries can protect high-risk transactions and the app runtime together. Buyers often evaluate OneSpan when digital banking, identity, and RASP-style controls must sit on one vendor roadmap with compliance-friendly deployment options.',
  3
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `url` = VALUES(`url`),
  `image` = VALUES(`image`),
  `description` = VALUES(`description`),
  `sort_order` = VALUES(`sort_order`);

-- ---------------------------------------------------------------------------
-- Remove prior RASP seed (topic slug rasp only)
-- ---------------------------------------------------------------------------

DELETE ctq FROM `course_topic_quiz_questions` ctq
  INNER JOIN `course_topics` ct ON ct.id = ctq.topic_id
  WHERE ct.slug = 'rasp';

DELETE ctp FROM `course_topic_products` ctp
  INNER JOIN `course_topics` ct ON ct.id = ctp.topic_id
  WHERE ct.slug = 'rasp';

DELETE cts FROM `course_topic_sections` cts
  INNER JOIN `course_topics` ct ON ct.id = cts.topic_id
  WHERE ct.slug = 'rasp';

DELETE FROM `course_topics` WHERE `slug` = 'rasp';

-- ---------------------------------------------------------------------------
-- Topic: RASP
-- ---------------------------------------------------------------------------

INSERT INTO `course_topics` (`slug`, `title`, `tagline`, `summary`, `sort_order`) VALUES
(
  'rasp',
  'RASP — Runtime Application Self-Protection',
  'From zero to conversational: mobile RASP explained properly',
  'Foundation training for mobile RASP: why mobile is different, how attacks work, the five defense layers, compliance drivers, and how to evaluate vendors confidently.',
  0
);

SET @rasp_topic_id = LAST_INSERT_ID();

-- ---------------------------------------------------------------------------
-- Sections (same copy as Frontend/src/data/courseTopics.ts)
-- ---------------------------------------------------------------------------

INSERT INTO `course_topic_sections` (`topic_id`, `heading`, `paragraphs`, `sort_order`) VALUES
(
  @rasp_topic_id,
  'Why mobile app security is a special problem',
  JSON_ARRAY(
    'Mobile banking apps do not run in bank-controlled environments. They run on customer devices that may be rooted, jailbroken, emulated, malware-infected, or actively manipulated by attackers. This is fundamentally different from web apps protected behind server-side perimeter controls.',
    'Five realities drive the need for mobile RASP: unmanaged devices, app binaries exposed to reverse engineering, hostile runtime environments, declining trust in SMS/email OTP, and limited server visibility once attackers control the device. The practical conclusion is simple: if the bank cannot control the phone, the app must defend itself.'
  ),
  0
),
(
  @rasp_topic_id,
  'What RASP is and what it continuously does',
  JSON_ARRAY(
    'Runtime Application Self-Protection (RASP) is security code that lives inside the running mobile app, monitors the surrounding environment, and reacts in real time. In plain language: perimeter tools guard the entrance, but RASP travels with the app.',
    'Operationally, mature RASP programs do three things continuously: detect hostile conditions (root/jailbreak/emulator/hooking), validate app integrity (tampering/repackaging/untrusted libraries), and respond according to policy (warn, block transaction, terminate session, downgrade features, or refuse to run).'
  ),
  1
),
(
  @rasp_topic_id,
  'How RASP is integrated into apps',
  JSON_ARRAY(
    'There are three common integration models. Compile-time integration rewrites app bytecode during builds and is usually the deepest protection. SDK integration adds vendor libraries into the app and is typically the most flexible enterprise path. Binary wrapping is fast and no-code, but often less deep than compile-time or SDK methods.',
    'As a rule of thumb from the course: compile-time is deepest, SDK is most flexible, no-code wrapping is fastest. In practice, many enterprise deployments use SDK integration as the base and add compile-time hardening where required.'
  ),
  2
),
(
  @rasp_topic_id,
  'How mobile attacks happen in the real world',
  JSON_ARRAY(
    'Four attack patterns are emphasized in this foundation course: static reverse engineering of app binaries, dynamic hooking with tools like Frida, banking trojans using overlay plus accessibility abuse, and SIM-swap-enabled account takeover flows.',
    'These patterns show why runtime defense matters. Attackers do not only probe APIs from outside; they manipulate the app on-device, intercept flows, and bypass client-side checks. Effective defense requires app hardening, runtime integrity checks, network trust controls like SSL pinning, and stronger in-app authentication patterns beyond SMS OTP.'
  ),
  3
),
(
  @rasp_topic_id,
  'The five layers of RASP defense',
  JSON_ARRAY(
    'Layer 1 is code hardening (including obfuscation) to resist static analysis and cloning. Layer 2 is anti-tampering and integrity checks to catch repackaging and code modification. Layer 3 is environment integrity to detect hostile runtime conditions such as root, emulators, overlays, and abuse paths.',
    'Layer 4 is network trust (for example SSL pinning and MITM resistance). Layer 5 is cryptographic key protection, including white-box and hardware-backed approaches where appropriate. A clear customer conversation should map each threat objection to one of these five layers.'
  ),
  4
),
(
  @rasp_topic_id,
  'RASP vs WAF vs MTD vs MAST',
  JSON_ARRAY(
    'These are complementary, not interchangeable. WAF protects web/API traffic at the server edge. RASP protects one specific app from inside runtime. MTD monitors device-wide threats across apps and network behavior. MAST is a pre-release testing discipline for finding vulnerabilities before deployment.',
    'The practical positioning used in customer conversations: WAF protects servers, RASP protects the app, MTD protects the device, and MAST improves release quality before runtime. Serious programs typically need all four.'
  ),
  5
),
(
  @rasp_topic_id,
  'Compliance and regulatory drivers',
  JSON_ARRAY(
    'The course highlights that many RASP decisions are compliance-driven, not feature-driven. For UAE contexts, it references CBUAE Notice 2025/3057 (with transition away from SMS/email OTP as sole mechanisms), the 2025 CBUAE law framework, and related guidance affecting controlled transaction channels.',
    'It also points to adjacent global reference frameworks customers may cite: PSD2, PCI MPoC, RBI/NPCI/SEBI, SAMA, and MAS TRM. The key sales skill is translating regulatory expectations into practical mobile control recommendations.'
  ),
  6
),
(
  @rasp_topic_id,
  '10-point checklist for evaluating vendors',
  JSON_ARRAY(
    'Use a consistent checklist: five-layer coverage, platform breadth (native and cross-platform), integration fit with CI/CD, measurable performance impact, OTA policy updates, telemetry/SIEM integration, compliance evidence quality, bundled capabilities (for example device binding or signing), vendor stability, and regional support model.',
    'This structure keeps evaluations objective and comparable. It also helps teams move from feature demos to implementation readiness, operational fit, and audit alignment.'
  ),
  7
);

-- ---------------------------------------------------------------------------
-- Topic ↔ products (order matches relatedProductSlugs in courseTopics.ts)
-- ---------------------------------------------------------------------------

INSERT INTO `course_topic_products` (`topic_id`, `product_id`, `sort_order`)
SELECT @rasp_topic_id, p.id, x.ord
FROM (
  SELECT 'protectt-ai' AS slug, 0 AS ord UNION ALL
  SELECT 'guardsquare', 1 UNION ALL
  SELECT 'zimperium', 2 UNION ALL
  SELECT 'onespan', 3
) AS x
INNER JOIN `products` p ON p.slug = x.slug;

-- ---------------------------------------------------------------------------
-- Topic quiz (33 questions — generated from Frontend/src/data/courseTopicQuizData.ts)
-- ---------------------------------------------------------------------------

INSERT INTO `course_topic_quiz_questions` (`topic_id`, `question`, `options`, `correct_index`, `sort_order`) VALUES
  (@rasp_topic_id, 'Q1. RASP stands for:', JSON_ARRAY('Remote Application Security Protocol', 'Runtime Application Self-Protection', 'Real-time API Security Platform', 'Reactive Application Shielding Protocol'), 1, 0),
  (@rasp_topic_id, 'Q2. Where does RASP physically live?', JSON_ARRAY('On the company’s web server, behind the firewall', 'Inside the network firewall appliance', 'Inside the mobile application itself, on the customer’s device', 'On the user’s mobile network carrier infrastructure'), 2, 1),
  (@rasp_topic_id, 'Q3. Which statement best captures the difference between WAF and RASP?', JSON_ARRAY('WAF protects networks; RASP protects users', 'WAF protects web applications externally; RASP protects mobile apps from inside', 'They do the same thing — RASP is just a newer name for WAF', 'WAF is hardware; RASP is software'), 1, 2),
  (@rasp_topic_id, 'Q4. SDK stands for:', JSON_ARRAY('Secure Data Key', 'Service Definition Kit', 'Software Development Kit', 'System Defense Kernel'), 2, 3),
  (@rasp_topic_id, 'Q5. Jailbreaking (iOS) or rooting (Android) means:', JSON_ARRAY('Recovering data from a phone whose passcode is forgotten', 'Removing manufacturer restrictions to gain full administrative access on the phone', 'Resetting a phone to factory settings', 'Backing up app data to the cloud'), 1, 4),
  (@rasp_topic_id, 'Q6. ‘Hooking’ in a mobile-attack context means:', JSON_ARRAY('Connecting a phone to a charger', 'Intercepting and modifying function calls inside an app while it is running', 'Pairing two devices via Bluetooth', 'A type of phishing attack delivered via SMS'), 1, 5),
  (@rasp_topic_id, 'Q7. Frida is best described as:', JSON_ARRAY('A type of mobile banking malware', 'An open-source dynamic-instrumentation toolkit attackers use to hook into running apps', 'A bank security framework standard', 'Apple’s built-in antivirus product'), 1, 6),
  (@rasp_topic_id, 'Q8. Code obfuscation primarily makes:', JSON_ARRAY('The app run faster on low-end phones', 'The app’s compiled code very difficult for an attacker to read or reverse-engineer', 'The app smaller in download size', 'The app work without an internet connection'), 1, 7),
  (@rasp_topic_id, 'Q9. SSL pinning protects against:', JSON_ARRAY('Loss of mobile signal in elevators', 'Man-in-the-middle attacks where an attacker intercepts or substitutes network traffic', 'Battery drain caused by background processes', 'Bluetooth scanning attacks'), 1, 8),
  (@rasp_topic_id, 'Q10. A repackaging attack means:', JSON_ARRAY('Compressing an app to save storage space', 'Disassembling a legitimate app, modifying its code, and republishing it as a clone or trojan', 'Updating an app via the official app store', 'Restoring an app from a cloud backup'), 1, 9),
  (@rasp_topic_id, 'Q11. Compile-time RASP differs from SDK-based RASP because:', JSON_ARRAY('Compile-time RASP performs no runtime checks', 'Compile-time RASP integrates protections during the app’s build process; SDK-based RASP is added as a runtime library', 'Compile-time RASP only works on iOS', 'They are exactly the same; the names are interchangeable'), 1, 10),
  (@rasp_topic_id, 'Q12. Polymorphic obfuscation means:', JSON_ARRAY('Writing the app in multiple programming languages', 'Each new build of the app produces structurally different protected code, defeating diffing-based attacks', 'Encrypting the app’s database file at rest', 'Allowing one app binary to run on many platforms'), 1, 11),
  (@rasp_topic_id, 'Q13. Over-the-air (OTA) RASP rule updates allow:', JSON_ARRAY('Mobile carriers to take control of the bank’s app', 'Updating the app’s security detections without releasing a new app-store version', 'Free wireless internet access', 'Customer support to be delivered over the phone'), 1, 12),
  (@rasp_topic_id, 'Q14. Why is bundling RASP with code obfuscation important?', JSON_ARRAY('It reduces licensing cost', 'Obfuscation hides the RASP checks themselves, so attackers cannot easily locate or disable them', 'It makes RASP rules visible for debugging', 'It removes the need for SSL altogether'), 1, 13),
  (@rasp_topic_id, 'Q15. White-box cryptography is used to:', JSON_ARRAY('Encrypt the app’s user-interface graphics', 'Protect cryptographic keys from being extracted even if the attacker has full access to the running app', 'Print receipts on a white background', 'Verify HTTPS server certificates'), 1, 14),
  (@rasp_topic_id, 'Q16. If RASP detects that an app is running inside an emulator, it typically:', JSON_ARRAY('Speeds up the app’s performance to compensate', 'Refuses to run, downgrades functionality, or alerts the backend (depending on configuration)', 'Triggers an automatic app update', 'Wipes the device remotely'), 1, 15),
  (@rasp_topic_id, 'Q17. Device binding is a technique that:', JSON_ARRAY('Glues two physical devices together', 'Cryptographically links a user’s account to a specific verified device', 'Connects a device to a charging station', 'Pairs Bluetooth speakers to a phone'), 1, 16),
  (@rasp_topic_id, 'Q18. The main reason banks worldwide are phasing out SMS one-time passwords is:', JSON_ARRAY('The cost of sending SMS messages is too high', 'SMS-based codes can be intercepted via SIM swap, phishing or device-side malware', 'Customers strongly prefer email', 'SMS only works on Android phones'), 1, 17),
  (@rasp_topic_id, 'Q19. Mobile Threat Defense (MTD) differs from RASP because:', JSON_ARRAY('MTD and RASP are the same thing', 'MTD protects the device and its environment broadly across all apps; RASP specifically protects one individual app from the inside', 'MTD only works on iOS', 'RASP is for laptops only, not phones'), 1, 18),
  (@rasp_topic_id, 'Q20. Why does CI/CD pipeline integration matter for a RASP product?', JSON_ARRAY('It allows the RASP product to auto-uninstall the app', 'Security can be applied automatically every time the app is built, with no developer-workflow disruption', 'It connects the RASP product to the bank’s cloud storage', 'App stores require it for submission'), 1, 19),
  (@rasp_topic_id, 'Q21. An overlay attack is:', JSON_ARRAY('Adding decorative graphics to a banking app', 'A malicious app drawing fake screens on top of legitimate apps to steal credentials', 'A type of database-injection attack', 'Performance-benchmarking a mobile app under load'), 1, 20),
  (@rasp_topic_id, 'Q22. Accessibility-Service abuse refers to:', JSON_ARRAY('Apps designed for users with visual impairments', 'Malicious apps misusing Android Accessibility Services to read screens, capture inputs and impersonate user actions', 'Disability legal-compliance frameworks', 'Voice-assistant integration'), 1, 21),
  (@rasp_topic_id, 'Q23. The most effective defence against SIM-swap fraud for mobile banking is:', JSON_ARRAY('Stronger passwords', 'In-app push authentication or device / SIM binding instead of SMS OTPs', 'Buying a more expensive phone', 'Restricting banking to Wi-Fi-only connections'), 1, 22),
  (@rasp_topic_id, 'Q24. A typical mobile-banking trojan:', JSON_ARRAY('Locks the phone for ransom only', 'Combines hooking, screen overlays and Accessibility-Service abuse to hijack legitimate banking sessions', 'Uses Bluetooth exclusively', 'Sends thank-you emails after each fraudulent transaction'), 1, 23),
  (@rasp_topic_id, 'Q25. Why is Android often more targeted by mobile-banking malware than iOS?', JSON_ARRAY('iOS is impossible to hack', 'Android allows side-loading apps and has many device variants, increasing the attack surface', 'iPhones don’t have banking apps', 'Apple users don’t use online banking'), 1, 24),
  (@rasp_topic_id, 'Q26. An app-cloning attack succeeds when:', JSON_ARRAY('Two end-users happen to have the same name', 'An attacker can extract the app’s logic, recreate it, and publish a near-identical malicious clone', 'Apps are written in Java rather than Kotlin', 'Banks decide to share APIs with third parties'), 1, 25),
  (@rasp_topic_id, 'Q27. According to Zimperium’s 2026 Banking Heist Report, mobile banking malware was found to target approximately:', JSON_ARRAY('Around 200 institutions worldwide', 'Around 1,243 financial institutions across 90 countries', 'Around 50 institutions, only in the United States', 'Around 10,000 institutions, all in Asia'), 1, 26),
  (@rasp_topic_id, 'Q28. Virtualisation-based mobile malware operates by:', JSON_ARRAY('Running the legitimate banking app inside a malicious sandbox where its behaviour can be observed and manipulated', 'Encrypting the device firmware', 'Adding new physical SIM cards remotely', 'Cloning the phone’s IMEI hardware identifier'), 0, 27),
  (@rasp_topic_id, 'Q29. The CBUAE deadline by which UAE financial institutions must phase out SMS / email OTPs is:', JSON_ARRAY('31 December 2025', '31 March 2026', '1 January 2027', '30 June 2025'), 1, 28),
  (@rasp_topic_id, 'Q30. The CBUAE notice that prohibits SMS / email OTPs as the sole authentication mechanism is referenced as:', JSON_ARRAY('CBUAE/AML/2024/100', 'CBUAE/FCMCP/2025/3057', 'CBUAE/CARD/2026/01', 'UAE-CB-2025-OTP'), 1, 29),
  (@rasp_topic_id, 'Q31. Under the New CBUAE Law (Federal Decree-Law No. 6 of 2025), maximum administrative fines for serious breaches can reach:', JSON_ARRAY('AED 10 million', 'AED 100 million', 'AED 1 billion', 'AED 5 billion'), 2, 30),
  (@rasp_topic_id, 'Q32. PSD2 ‘dynamic linking’ requires that:', JSON_ARRAY('Banks always require a fingerprint for login', 'Each authentication code is uniquely tied to that specific transaction’s amount and beneficiary', 'Customers may only use mobile apps, not the web', 'All transactions are retained for at least 10 years'), 1, 31),
  (@rasp_topic_id, 'Q33. PCI MPoC is a standard for:', JSON_ARRAY('Online merchant card-data storage', 'Mobile-Payments-on-COTS — using a mobile phone (a commercial off-the-shelf device) to accept card payments', 'Credit-bureau reporting', 'ATM hardware certification'), 1, 32)

;

-- ---------------------------------------------------------------------------
-- Optional: sample quiz rows for admin dashboard testing (replace user_id)
-- ---------------------------------------------------------------------------
-- INSERT INTO `quiz_attempts` (`user_id`, `quiz_type`, `subject_slug`, `score_correct`, `score_total`) VALUES
-- (1, 'product_mcq', 'zimperium', 4, 5),
-- (1, 'course_topic_quiz', 'rasp', 30, 33);