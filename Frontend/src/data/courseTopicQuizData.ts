export type TopicQuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type CourseTopicQuiz = readonly TopicQuizQuestion[];

export const COURSE_TOPIC_QUIZ_BY_SLUG: Record<string, CourseTopicQuiz> = {
  rasp: [
    {
      question: 'Q1. RASP stands for:',
      options: [
        'Remote Application Security Protocol',
        'Runtime Application Self-Protection',
        'Real-time API Security Platform',
        'Reactive Application Shielding Protocol',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q2. Where does RASP physically live?',
      options: [
        'On the company’s web server, behind the firewall',
        'Inside the network firewall appliance',
        'Inside the mobile application itself, on the customer’s device',
        'On the user’s mobile network carrier infrastructure',
      ],
      correctIndex: 2,
    },
    {
      question: 'Q3. Which statement best captures the difference between WAF and RASP?',
      options: [
        'WAF protects networks; RASP protects users',
        'WAF protects web applications externally; RASP protects mobile apps from inside',
        'They do the same thing — RASP is just a newer name for WAF',
        'WAF is hardware; RASP is software',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q4. SDK stands for:',
      options: [
        'Secure Data Key',
        'Service Definition Kit',
        'Software Development Kit',
        'System Defense Kernel',
      ],
      correctIndex: 2,
    },
    {
      question: 'Q5. Jailbreaking (iOS) or rooting (Android) means:',
      options: [
        'Recovering data from a phone whose passcode is forgotten',
        'Removing manufacturer restrictions to gain full administrative access on the phone',
        'Resetting a phone to factory settings',
        'Backing up app data to the cloud',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q6. ‘Hooking’ in a mobile-attack context means:',
      options: [
        'Connecting a phone to a charger',
        'Intercepting and modifying function calls inside an app while it is running',
        'Pairing two devices via Bluetooth',
        'A type of phishing attack delivered via SMS',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q7. Frida is best described as:',
      options: [
        'A type of mobile banking malware',
        'An open-source dynamic-instrumentation toolkit attackers use to hook into running apps',
        'A bank security framework standard',
        'Apple’s built-in antivirus product',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q8. Code obfuscation primarily makes:',
      options: [
        'The app run faster on low-end phones',
        'The app’s compiled code very difficult for an attacker to read or reverse-engineer',
        'The app smaller in download size',
        'The app work without an internet connection',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q9. SSL pinning protects against:',
      options: [
        'Loss of mobile signal in elevators',
        'Man-in-the-middle attacks where an attacker intercepts or substitutes network traffic',
        'Battery drain caused by background processes',
        'Bluetooth scanning attacks',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q10. A repackaging attack means:',
      options: [
        'Compressing an app to save storage space',
        'Disassembling a legitimate app, modifying its code, and republishing it as a clone or trojan',
        'Updating an app via the official app store',
        'Restoring an app from a cloud backup',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q11. Compile-time RASP differs from SDK-based RASP because:',
      options: [
        'Compile-time RASP performs no runtime checks',
        'Compile-time RASP integrates protections during the app’s build process; SDK-based RASP is added as a runtime library',
        'Compile-time RASP only works on iOS',
        'They are exactly the same; the names are interchangeable',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q12. Polymorphic obfuscation means:',
      options: [
        'Writing the app in multiple programming languages',
        'Each new build of the app produces structurally different protected code, defeating diffing-based attacks',
        'Encrypting the app’s database file at rest',
        'Allowing one app binary to run on many platforms',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q13. Over-the-air (OTA) RASP rule updates allow:',
      options: [
        'Mobile carriers to take control of the bank’s app',
        'Updating the app’s security detections without releasing a new app-store version',
        'Free wireless internet access',
        'Customer support to be delivered over the phone',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q14. Why is bundling RASP with code obfuscation important?',
      options: [
        'It reduces licensing cost',
        'Obfuscation hides the RASP checks themselves, so attackers cannot easily locate or disable them',
        'It makes RASP rules visible for debugging',
        'It removes the need for SSL altogether',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q15. White-box cryptography is used to:',
      options: [
        'Encrypt the app’s user-interface graphics',
        'Protect cryptographic keys from being extracted even if the attacker has full access to the running app',
        'Print receipts on a white background',
        'Verify HTTPS server certificates',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q16. If RASP detects that an app is running inside an emulator, it typically:',
      options: [
        'Speeds up the app’s performance to compensate',
        'Refuses to run, downgrades functionality, or alerts the backend (depending on configuration)',
        'Triggers an automatic app update',
        'Wipes the device remotely',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q17. Device binding is a technique that:',
      options: [
        'Glues two physical devices together',
        'Cryptographically links a user’s account to a specific verified device',
        'Connects a device to a charging station',
        'Pairs Bluetooth speakers to a phone',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q18. The main reason banks worldwide are phasing out SMS one-time passwords is:',
      options: [
        'The cost of sending SMS messages is too high',
        'SMS-based codes can be intercepted via SIM swap, phishing or device-side malware',
        'Customers strongly prefer email',
        'SMS only works on Android phones',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q19. Mobile Threat Defense (MTD) differs from RASP because:',
      options: [
        'MTD and RASP are the same thing',
        'MTD protects the device and its environment broadly across all apps; RASP specifically protects one individual app from the inside',
        'MTD only works on iOS',
        'RASP is for laptops only, not phones',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q20. Why does CI/CD pipeline integration matter for a RASP product?',
      options: [
        'It allows the RASP product to auto-uninstall the app',
        'Security can be applied automatically every time the app is built, with no developer-workflow disruption',
        'It connects the RASP product to the bank’s cloud storage',
        'App stores require it for submission',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q21. An overlay attack is:',
      options: [
        'Adding decorative graphics to a banking app',
        'A malicious app drawing fake screens on top of legitimate apps to steal credentials',
        'A type of database-injection attack',
        'Performance-benchmarking a mobile app under load',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q22. Accessibility-Service abuse refers to:',
      options: [
        'Apps designed for users with visual impairments',
        'Malicious apps misusing Android Accessibility Services to read screens, capture inputs and impersonate user actions',
        'Disability legal-compliance frameworks',
        'Voice-assistant integration',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q23. The most effective defence against SIM-swap fraud for mobile banking is:',
      options: [
        'Stronger passwords',
        'In-app push authentication or device / SIM binding instead of SMS OTPs',
        'Buying a more expensive phone',
        'Restricting banking to Wi-Fi-only connections',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q24. A typical mobile-banking trojan:',
      options: [
        'Locks the phone for ransom only',
        'Combines hooking, screen overlays and Accessibility-Service abuse to hijack legitimate banking sessions',
        'Uses Bluetooth exclusively',
        'Sends thank-you emails after each fraudulent transaction',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q25. Why is Android often more targeted by mobile-banking malware than iOS?',
      options: [
        'iOS is impossible to hack',
        'Android allows side-loading apps and has many device variants, increasing the attack surface',
        'iPhones don’t have banking apps',
        'Apple users don’t use online banking',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q26. An app-cloning attack succeeds when:',
      options: [
        'Two end-users happen to have the same name',
        'An attacker can extract the app’s logic, recreate it, and publish a near-identical malicious clone',
        'Apps are written in Java rather than Kotlin',
        'Banks decide to share APIs with third parties',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q27. According to Zimperium’s 2026 Banking Heist Report, mobile banking malware was found to target approximately:',
      options: [
        'Around 200 institutions worldwide',
        'Around 1,243 financial institutions across 90 countries',
        'Around 50 institutions, only in the United States',
        'Around 10,000 institutions, all in Asia',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q28. Virtualisation-based mobile malware operates by:',
      options: [
        'Running the legitimate banking app inside a malicious sandbox where its behaviour can be observed and manipulated',
        'Encrypting the device firmware',
        'Adding new physical SIM cards remotely',
        'Cloning the phone’s IMEI hardware identifier',
      ],
      correctIndex: 0,
    },
    {
      question: 'Q29. The CBUAE deadline by which UAE financial institutions must phase out SMS / email OTPs is:',
      options: [
        '31 December 2025',
        '31 March 2026',
        '1 January 2027',
        '30 June 2025',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q30. The CBUAE notice that prohibits SMS / email OTPs as the sole authentication mechanism is referenced as:',
      options: [
        'CBUAE/AML/2024/100',
        'CBUAE/FCMCP/2025/3057',
        'CBUAE/CARD/2026/01',
        'UAE-CB-2025-OTP',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q31. Under the New CBUAE Law (Federal Decree-Law No. 6 of 2025), maximum administrative fines for serious breaches can reach:',
      options: [
        'AED 10 million',
        'AED 100 million',
        'AED 1 billion',
        'AED 5 billion',
      ],
      correctIndex: 2,
    },
    {
      question: 'Q32. PSD2 ‘dynamic linking’ requires that:',
      options: [
        'Banks always require a fingerprint for login',
        'Each authentication code is uniquely tied to that specific transaction’s amount and beneficiary',
        'Customers may only use mobile apps, not the web',
        'All transactions are retained for at least 10 years',
      ],
      correctIndex: 1,
    },
    {
      question: 'Q33. PCI MPoC is a standard for:',
      options: [
        'Online merchant card-data storage',
        'Mobile-Payments-on-COTS — using a mobile phone (a commercial off-the-shelf device) to accept card payments',
        'Credit-bureau reporting',
        'ATM hardware certification',
      ],
      correctIndex: 1,
    },
  ],
};

export function getCourseTopicQuizBySlug(slug: string): CourseTopicQuiz | undefined {
  return COURSE_TOPIC_QUIZ_BY_SLUG[slug];
}
