"""Scam Detection Pattern Database.

Categorized into:
1. ACTION_PATTERNS: Demands for OTP, PIN, app installs, remote screen sharing, payment transfers
2. URGENCY_PATTERNS: Artificial deadlines, service disconnect threats, digital arrest coercion
3. IMPERSONATION_PATTERNS: Fake bank, electricity board, police, CBI, customs claims
4. LINK_PATTERNS: Phishing domains, unverified verification links, URL shorteners
5. LEGITIMATE_NOTIFICATIONS: Safe transactional notifications (e.g. routine bill, bank OTP stating 'do not share')
"""

import re

# ==============================================================================
# 1. ACTION PATTERNS (Dangerous things the message demands the user to do)
# ==============================================================================
ACTION_PATTERNS = [
    {
        "id": "credential_otp_pin",
        "category": "Credential Demanded",
        "severity": "CRITICAL",
        "standard_action": "SHARE_CODE_OR_CREDENTIALS",
        "regex": re.compile(
            r"(?:share|send|provide|give|reply with|forward|enter)\s+(?:your\s+)?(?:6[-\s]?digit\s+)?(?:otp|pin|password|cvv|mpin|code)",
            re.IGNORECASE
        ),
        "explanation_en": "Banks never ask you to share your OTP or PIN.",
        "explanation_hi": "बैंक कभी भी आपसे OTP या PIN साझा करने के लिए नहीं कहता।",
        "explanation_te": "బ్యాంకులు ఎప్పుడూ OTP లేదా PIN ను పంచుకోవాలని అడగవు."
    },
    {
        "id": "malicious_app_install",
        "category": "Malicious App Download",
        "severity": "CRITICAL",
        "standard_action": "INSTALL_APP_OR_ENABLE_ACCESS",
        "regex": re.compile(
            r"(?:install|download)\s+(?:the\s+)?(?:update\s+)?(?:bill|app|file|quicksupport|anydesk|teamviewer|rustdesk|support)?\.apk"
            r"|(?:install|download)\s+(?:anydesk|teamviewer|quicksupport|rustdesk)",
            re.IGNORECASE
        ),
        "explanation_en": "Demands installing an untrusted APK file or remote desktop software that can control your phone.",
        "explanation_hi": "संदेश में अज्ञात APK फ़ाइल या रिमोट कंट्रोल ऐप (AnyDesk आदि) इंस्टॉल करने को कहा गया है।",
        "explanation_te": "మీ ఫోన్‌ను నియంత్రించగల అనుమానాస్పద APK లేదా రిమోట్ యాప్‌ను ఇన్‌స్టాల్ చేయమని అడుగుతోంది."
    },
    {
        "id": "urgent_unverified_transfer",
        "category": "Money Transfer or Verification Charge Demand",
        "severity": "HIGH",
        "standard_action": "SEND_MONEY",
        "regex": re.compile(
            r"(?:transfer|send|pay|deposit)\s+(?:rs\.?|inr|₹)?\s*\d+"
            r"|(?:refundable\s+)?(?:rs\.?|inr|₹)?\s*\d+\s*(?:refundable\s+)?verification\s+charge"
            r"|(?:send|transfer|pay)\s+(?:money|cash|fee|charge|advance|fine|bail)"
            r"|can\s+you\s+(?:please\s+)?send\s+(?:rs\.?|inr|₹)?\s*\d+",
            re.IGNORECASE
        ),
        "explanation_en": "Requests an urgent money transfer or a 'verification fee'.",
        "explanation_hi": "तत्काल पैसे भेजने या 'सत्यापन शुल्क' (वेरिफिकेशन फ़ीस) भरने की मांग की गई है।",
        "explanation_te": "తక్షణ డబ్బు బదిలీ లేదా ధృవీకరణ రుసుము చెల్లించాలని అడుగుతోంది."
    },
    {
        "id": "action_verification_link",
        "category": "Actionable Link for Verification or Payment",
        "severity": "HIGH",
        "standard_action": "VISIT_UNTRUSTED_LINK",
        "regex": re.compile(
            r"(?:https?://[^\s/$.?#].[^\s]*(?:/verify|/payment|/billing|/login|/update|/kyc|/claim|/process))"
            r"|(?:[a-zA-Z0-9-]+\.(?:example|xyz|info|top|club|site|link|tk|ml|cf|gq|ga|buzz|online|icu|vip|work))",
            re.IGNORECASE
        ),
        "explanation_en": "An unfamiliar link pretending to be your bank.",
        "explanation_hi": "आपके बैंक जैसा दिखने वाला एक अपरिचित या फर्जी वेब लिंक।",
        "explanation_te": "మీ బ్యాంక్ లాగా నటించే తెలియని లేదా అనుమానాస్పద వెబ్ లింక్."
    },
    {
        "id": "suspicious_shortlink",
        "category": "Obfuscated / Shortened Link",
        "severity": "MEDIUM",
        "standard_action": "VISIT_UNTRUSTED_LINK",
        "regex": re.compile(
            r"(?:https?://)?(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy)/[a-zA-Z0-9_\-]+",
            re.IGNORECASE
        ),
        "explanation_en": "Contains a shortened link that hides the true destination website.",
        "explanation_hi": "संदेश में छोटा (shortened) लिंक है जो असली वेबसाइट के पते को छुपाता है।",
        "explanation_te": "అసలు వెబ్‌సైట్ చిరునామాను దాచే షార్ట్‌లింక్ ఇందులో ఉంది."
    },
    {
        "id": "call_personal_number",
        "category": "Call Unverified Personal Contact",
        "severity": "HIGH",
        "standard_action": "CALL_UNKNOWN_NUMBER",
        "regex": re.compile(
            r"(?:contact|call)\s+(?:our\s+)?(?:power\s+officer|manager|officer|sir|support)\s+(?:at|on)?\s*\d{10}",
            re.IGNORECASE
        ),
        "explanation_en": "Asks you to call a personal 10-digit mobile number instead of an official customer care line.",
        "explanation_hi": "आधिकारिक हेल्पलाइन के बजाय किसी 10-अंकों के व्यक्तिगत मोबाइल नंबर पर कॉल करने को कहा गया है।",
        "explanation_te": "అధికారిక హెల్ప్‌లైన్‌కు బదులుగా వ్యక్తిగత మొబైల్ నంబర్‌కు కాల్ చేయమని అడుగుతోంది."
    },
    {
        "id": "discourage_independent_verification",
        "category": "Discouraging Independent Verification",
        "severity": "HIGH",
        "standard_action": "ISOLATE_USER",
        "regex": re.compile(
            r"do\s+not\s+(?:contact|visit|call)\s+(?:the\s+)?(?:local\s+office|branch|bank|police)",
            re.IGNORECASE
        ),
        "explanation_en": "Explicitly instructs you NOT to contact your local office or branch — a classic isolation tactic.",
        "explanation_hi": "स्थानीय कार्यालय या शाखा से संपर्क न करने की हिदायत दी गई है, जो ठगी का एक बड़ा संकेत है।",
        "explanation_te": "మీ స్థానిక కార్యాలయాన్ని సంప్రదించవద్దని చెబుతోంది — ఇది మోసగాళ్ల సాధారణ ఎత్తుగడ."
    }
]

# ==============================================================================
# 2. URGENCY & COERCION PATTERNS (Pressure tactics that induce panic)
# ==============================================================================
URGENCY_PATTERNS = [
    {
        "id": "service_interruption_threat",
        "category": "Service Disconnection or Interruption Threat",
        "severity": "HIGH",
        "standard_action": "ACCOUNT_OR_SERVICE_THREAT",
        "regex": re.compile(
            r"(?:electricity|power|gas|water|connection)\s+(?:will\s+be\s+)?(?:disconnected|cutoff|terminated|suspended|stopped)"
            r"|(?:avoid|prevent)\s+(?:a\s+)?(?:temporary\s+)?service\s+(?:interruption|disconnection|cutoff|suspension)"
            r"|service\s+interruption",
            re.IGNORECASE
        ),
        "explanation_en": "Threatens abrupt utility disconnection or service interruption.",
        "explanation_hi": "बिजली या सेवा अचानक काट देने की धमकी दी गई है।",
        "explanation_te": "విద్యుత్ లేదా సేవలను వెంటనే నిలిపివేస్తామని బెదిరిస్తోంది."
    },
    {
        "id": "deadline_pressure",
        "category": "Artificial Deadline Pressure",
        "severity": "MEDIUM",
        "standard_action": "ACCOUNT_OR_SERVICE_THREAT",
        "regex": re.compile(
            r"(?:tonight\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)"
            r"|(?:by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*today)"
            r"|(?:(?:within|in)\s+\d{1,2}\s+(?:hours?|minutes?|days?))"
            r"|(?:blocked\s+in\s+\d{1,2}\s+hours?)"
            r"|(?:immediately|urgent|right now|at once|within 24 hours|in 24 hours)",
            re.IGNORECASE
        ),
        "explanation_en": "Creates urgency so you act without checking.",
        "explanation_hi": "सोचने का समय न देने के लिए जल्दबाज़ी और समयसीमा का दबाव बनाया गया है।",
        "explanation_te": "పరిశీలించకుండా వెంటనే పనిచేయడానికి సమయ ఒత్తిడిని సృష్టిస్తుంది."
    },
    {
        "id": "digital_arrest_coercion",
        "category": "Fake Legal / Digital Arrest Coercion",
        "severity": "CRITICAL",
        "standard_action": "COERCIVE_THREAT",
        "regex": re.compile(
            r"digital\s+arrest|arrest\s+warrant|crime\s+branch|cbi|narcotics|seized\s+at\s+airport|skype\s+video\s+call",
            re.IGNORECASE
        ),
        "explanation_en": "Uses fake police, CBI, or airport drug seizure claims to threaten arrest. 'Digital Arrest' is completely fraudulent.",
        "explanation_hi": "पुलिस, CBI या नशीली दवाओं के नाम पर 'डिजिटल अरेस्ट' की फ़र्ज़ी धमकी दी गई है। भारतीय क़ानून में ऐसा कुछ नहीं होता।",
        "explanation_te": "పోలీస్ లేదా CBI పేరుతో 'డిజిటల్ అరెస్ట్' అని బెదిరిస్తోంది. చట్టంలో డిజిటల్ అరెస్ట్ అనేది ఉండదు."
    },
    {
        "id": "account_sim_kyc_block",
        "category": "Account or SIM Deactivation Threat",
        "severity": "HIGH",
        "standard_action": "ACCOUNT_OR_SERVICE_THREAT",
        "regex": re.compile(
            r"(?:account|sim|card|pan|kyc)\s+(?:will\s+be\s+)?(?:blocked|suspended|deactivated|frozen|closed)(?!\s+(?:in|within)\s+\d+)"
            r"|your\s+account\s+will\s+be\s+blocked(?!\s+(?:in|within)\s+\d+)",
            re.IGNORECASE
        ),
        "explanation_en": "Threatens to block your bank account, SIM card, or PAN card.",
        "explanation_hi": "बैंक खाता, सिम कार्ड या पैन कार्ड बंद होने का डर दिखाया गया है।",
        "explanation_te": "బ్యాంకు ఖాతా లేదా సిమ్ కార్డ్ బ్లాక్ చేస్తామని బెదిరిస్తోంది."
    },
    {
        "id": "lottery_job_subsidy",
        "category": "Unrealistic Reward / Lottery Trap",
        "severity": "HIGH",
        "standard_action": "CLAIM_PRIZE",
        "regex": re.compile(
            r"(?:won|win|winner|congratulations)\s+(?:rs\.?|inr|₹)?\s*[\d,]+\s*(?:in\s+)?(?:kbc|lottery|lucky\s+draw|prize)"
            r"|daily\s+earning\s+(?:rs\.?|inr|₹)?\s*\d+|part[-\s]?time\s+job\s+like\s+videos",
            re.IGNORECASE
        ),
        "explanation_en": "Promises fake lottery prizes, KBC rewards, or unrealistic work-from-home earnings.",
        "explanation_hi": "फ़र्ज़ी लॉटरी, KBC इनाम या घर बैठे भारी कमाई का लालच दिया गया है।",
        "explanation_te": "నకిలీ లాటరీ, బహుమతులు లేదా అనుమానాస్పద ఆదాయ ఆఫర్లతో ప్రలోభపెడుతోంది."
    }
]

# ==============================================================================
# 3. IMPERSONATION PATTERNS (Entities frequently mimicked by fraudsters)
# ==============================================================================
IMPERSONATION_PATTERNS = [
    {
        "id": "fake_bank",
        "category": "Bank Impersonation",
        "regex": re.compile(r"\b(?:sbi|hdfc|icici|pnb|axis\s*bank|bank\s*manager|rbi)\b", re.IGNORECASE)
    },
    {
        "id": "fake_utility",
        "category": "Electricity / Utility Board Impersonation",
        "regex": re.compile(r"\b(?:electricity\s*office|power\s*officer|discom|bescom|uppcl|tneb|tgspdcl|bill\s*desk)\b", re.IGNORECASE)
    },
    {
        "id": "fake_law_enforcement",
        "category": "Law Enforcement Impersonation",
        "regex": re.compile(r"\b(?:cbi|police|cyber\s*crime|customs|crime\s*branch|supreme\s*court|inspector)\b", re.IGNORECASE)
    }
]

# ==============================================================================
# 4. LEGITIMATE SIGNALS (Signals indicating routine informational messages)
# ==============================================================================
LEGITIMATE_NOTIFICATIONS = [
    {
        "id": "legitimate_bank_otp_warning",
        "category": "Legitimate Bank OTP Alert",
        "regex": re.compile(
            r"(?:do\s+not\s+share\s+(?:this\s+)?(?:otp|code|password)\s+with\s+anyone)"
            r"|(?:never\s+share\s+(?:your\s+)?(?:otp|pin))"
            r"|(?:state\s+bank\s+never\s+asks\s+for\s+otp)"
            r"|(?:bank\s+never\s+calls\s+to\s+ask\s+otp)",
            re.IGNORECASE
        )
    },
    {
        "id": "routine_bill_notice",
        "category": "Standard Informational Notice",
        "regex": re.compile(
            r"(?:your\s+monthly\s+bill\s+is\s+available)"
            r"|(?:open\s+the\s+service\s+app\s+you\s+normally\s+use)"
            r"|(?:credited\s+to\s+your\s+a/c)"
            r"|(?:debited\s+from\s+your\s+a/c)",
            re.IGNORECASE
        )
    }
]
