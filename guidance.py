"""Bilingual & Multilingual Safety Guidance, Refusal Scripts, and Context Questions.

Tailored for elderly and rural users with zero technical jargon.
Covers English, Hindi, and Telugu.
"""

from typing import List, Dict, Any, Optional

# Threat category to specific next actions mapping
GUIDANCE_CATALOG = {
    "Malicious App Download": {
        "en": [
            "DO NOT download or install the file or link sent in the message.",
            "Electricity boards, banks, and courier companies NEVER send APK files to customers.",
            "If you already downloaded it, turn on Airplane Mode immediately and ask a trusted family member or technician to remove it."
        ],
        "hi": [
            "संदेश में भेजे गए किसी भी लिंक या फ़ाइल (.apk) को डाउनलोड न करें।",
            "बिजली विभाग, बैंक या कूरियर कंपनियाँ कभी भी ग्राहकों को APK फ़ाइल नहीं भेजतीं।",
            "अगर आपने गलती से इसे डाउनलोड कर लिया है, तो तुरंत फ़ोन को 'Airplane Mode' पर डालें और किसी भरोसेमंद व्यक्ति से इसे डिलीट करवाएँ।"
        ],
        "te": [
            "సందేశంలో పంపిన ఏ ఫైల్ (.apk) లేదా లింక్‌ను డౌన్‌లోడ్ చేయవద్దు.",
            "విద్యుత్ బోర్డులు, బ్యాంకులు లేదా కొరియర్ సంస్థలు కస్టమర్లకు ఎప్పుడూ APK ఫైల్స్ పంపవు.",
            "మీరు ఇప్పటికే డౌన్‌లోడ్ చేసి ఉంటే, వెంటనే ఫోన్‌ను 'Airplane Mode' లో ఉంచి సహాయం తీసుకోండి."
        ]
    },
    "Remote Device Control": {
        "en": [
            "DO NOT install AnyDesk, TeamViewer, or QuickSupport as requested.",
            "Fraudsters use these tools to take control of your screen and see your bank passwords.",
            "Hang up the phone immediately if someone is instructing you to install these."
        ],
        "hi": [
            "एनीडेस्क (AnyDesk) या टीमव्यूअर जैसी ऐप बिल्कुल डाउनलोड न करें।",
            "धोखेबाज़ इन ऐप्स के ज़रिए आपके फ़ोन की स्क्रीन देखकर बैंक से पैसे निकाल लेते हैं।",
            "अगर कोई फ़ोन पर बात करते हुए यह ऐप डाउनलोड करने को कहे, तो तुरंत फ़ोन काट दें।"
        ],
        "te": [
            "AnyDesk లేదా TeamViewer వంటి రిమోట్ యాప్‌లను అస్సలు ఇన్‌స్టాల్ చేయవద్దు.",
            "మోసగాళ్లు వీటి ద్వారా మీ ఫోన్ స్క్రీన్ చూసి బ్యాంక్ పాస్‌వర్డ్స్ దొంగిలిస్తారు.",
            "ఎవరైనా ఫోన్‌లో మాట్లాడుతూ ఈ యాప్‌లను ఇన్‌స్టాల్ చేయమని చెబితే వెంటనే కాల్ కట్ చేయండి."
        ]
    },
    "Credential Demanded": {
        "en": [
            "NEVER share your 6-digit OTP, UPI PIN, or ATM PIN with anyone.",
            "Bank employees, police, and government officials will NEVER ask for your OTP.",
            "Entering your UPI PIN always DEDUCTS money from your account; it is never needed to receive money."
        ],
        "hi": [
            "अपना 6-अंकों का OTP, UPI PIN या पासवर्ड कभी किसी को न बताएं।",
            "बैंक कर्मचारी, पुलिस या कोई भी अधिकारी कभी आपसे OTP नहीं मांगते।",
            "UPI PIN डालने से हमेशा खाते से पैसे कटते हैं; पैसे प्राप्त करने के लिए PIN की ज़रूरत नहीं होती।"
        ],
        "te": [
            "మీ 6 అంకెల OTP, UPI PIN లేదా పాస్‌వర్డ్ ఎవరితోనూ పంచుకోవద్దు.",
            "బ్యాంక్ సిబ్బంది, పోలీసులు లేదా అధికారులు ఎప్పుడూ మీ OTP అడగరు.",
            "UPI PIN ఎంటర్ చేస్తే ఎల్లప్పుడూ మీ ఖాతా నుంచే డబ్బు కట్ అవుతుంది."
        ]
    },
    "Money Transfer or Verification Charge Demand": {
        "en": [
            "DO NOT send any money, processing fee, or 'refundable verification charge'.",
            "Legitimate utilities and banks never require a small fee transfer to verify your identity.",
            "Check your official physical bill or visit the local branch before transferring any money."
        ],
        "hi": [
            "कोई भी पैसा, प्रोसेसिंग फ़ीस या 'रिफंडेबल वेरिफिकेशन चार्ज' न भेजें।",
            "असली कंपनियां पहचान सत्यापित करने के लिए कभी भी पैसे या चार्ज ट्रांसफर करने को नहीं कहतीं।",
            "पैसे भेजने से पहले अपने आधिकारिक काग़ज़ी बिल की जांच करें या नज़दीकी शाखा जाएं।"
        ],
        "te": [
            "ఎటువంటి డబ్బు, ప్రాసెసింగ్ ఫీజు లేదా 'రీఫండబుల్ వెరిఫికేషన్ ఛార్జ్' పంపవద్దు.",
            "అసలైన విద్యుత్ లేదా బ్యాంకులు గుర్తింపు కోసం చిన్న మొత్తం చెల్లించమని ఎప్పుడూ అడగవు.",
            "డబ్బు పంపే ముందు మీ అధికారిక పేపర్ బిల్లు లేదా సమీప శాఖను సంప్రదించండి."
        ]
    },
    "Immediate Money Transfer Demand": {
        "en": [
            "DO NOT send money to prevent account blocking, avoid arrest, or claim a prize.",
            "Legitimate government agencies and banks do not accept fees via personal UPI IDs.",
            "Consult a trusted family member or visit the physical bank branch before paying any amount."
        ],
        "hi": [
            "खाता चालू रखने, गिरफ़्तारी से बचने या इनाम के लिए किसी भी खाते में पैसे न भेजें।",
            "असली सरकारी विभाग या बैंक किसी व्यक्तिगत UPI आईडी पर पैसे नहीं मंगवाते।",
            "पैसे भेजने से पहले अपने परिवार के सदस्य से सलाह लें या सीधे बैंक शाखा जाएं।"
        ],
        "te": [
            "ఖాతా బ్లాక్ కాకుండా ఉండటానికి లేదా అరెస్ట్ నివారణకు డబ్బు పంపవద్దు.",
            "అధికారిక ప్రభుత్వ సంస్థలు లేదా బ్యాంకులు వ్యక్తిగత UPI ID ల ద్వారా ఫీజులు తీసుకోవు.",
            "ఎవరికీ డబ్బు పంపే ముందు మీ కుటుంబ సభ్యులను సంప్రదించండి."
        ]
    },
    "Service Disconnection or Interruption Threat": {
        "en": [
            "DO NOT click links or call numbers provided in the text message.",
            "Check your physical paper electricity or utility bill for the official customer care number.",
            "Utility companies do not terminate connections abruptly via SMS without prior written notice."
        ],
        "hi": [
            "संदेश में दिए गए किसी भी लिंक पर क्लिक न करें और न ही उस नंबर पर कॉल करें।",
            "अपने पुराने काग़ज़ी बिजली बिल पर लिखे आधिकारिक हेल्पलाइन नंबर पर ही संपर्क करें।",
            "बिजली विभाग कभी भी बिना पूर्व लिखित सूचना के SMS भेजकर अचानक कनेक्शन नहीं काटता।"
        ],
        "te": [
            "సందేశంలో ఉన్న లింక్‌లపై క్లిక్ చేయవద్దు మరియు ఆ నంబర్లకు కాల్ చేయవద్దు.",
            "అధికారిక కస్టమర్ కేర్ నంబర్ కోసం మీ పేపర్ విద్యుత్ బిల్లును తనిఖీ చేయండి.",
            "విద్యుత్ శాఖ ముందస్తు వ్రాతపూర్వక నోటీసు లేకుండా SMS ద్వారా విద్యుత్ సరఫరాను ఆపదు."
        ]
    },
    "Utility Disconnection Threat": {
        "en": [
            "DO NOT call the personal mobile number given in the text message.",
            "Look at your physical paper electricity bill or payment receipt for the true official customer care number.",
            "Power companies do not cut electricity connections via a sudden evening text message."
        ],
        "hi": [
            "SMS में दिए गए किसी भी व्यक्तिगत मोबाइल नंबर पर कॉल न करें।",
            "अपने पुराने काग़ज़ी बिजली बिल पर लिखे आधिकारिक हेल्पलाइन नंबर पर ही संपर्क करें।",
            "बिजली विभाग कभी भी अचानक ऐसे SMS भेजकर रात में बिजली नहीं काटता।"
        ],
        "te": [
            "SMS లో ఇచ్చిన వ్యక్తిగత మొబైల్ నంబర్‌కు కాల్ చేయవద్దు.",
            "మీ అసలైన పేపర్ బిల్లులోని అధికారిక కస్టమర్ కేర్ నంబర్‌ను మాత్రమే ఉపయోగించండి.",
            "విద్యుత్ సంస్థలు అకస్మాత్తుగా రాత్రిపూట SMS పంపి కరెంట్ తీసివేయవు."
        ]
    },
    "Fake Legal / Digital Arrest Coercion": {
        "en": [
            "Remember: 'DIGITAL ARREST' DOES NOT EXIST IN INDIAN LAW.",
            "Police, CBI, Customs, and Judges NEVER conduct trials or arrest people on Skype or WhatsApp video calls.",
            "Hang up the video call immediately. You are not in legal danger."
        ],
        "hi": [
            "ध्यान दें: भारतीय क़ानून में 'डिजिटल अरेस्ट' (Digital Arrest) जैसा कुछ नहीं होता।",
            "कोई भी पुलिस, CBI या जज कभी भी WhatsApp या वीडियो कॉल पर गिरफ़्तारी या पूछताछ नहीं करते।",
            "तुरंत वीडियो कॉल काट दें। आप किसी क़ानूनी संकट में नहीं हैं, यह पूरी तरह फ़र्ज़ी है।"
        ],
        "te": [
            "గుర్తుంచుకోండి: భారతీయ చట్టంలో 'డిజిటల్ అరెస్ట్' అనేది అసలు లేదు.",
            "పోలీస్, CBI లేదా న్యాయమూర్తులు WhatsApp లేదా స్కైప్ వీడియో కాల్స్‌లో విచారణ జరపరు.",
            "వెంటనే వీడియో కాల్ కట్ చేయండి. మీరు ఏ చట్టపరమైన ప్రమాదంలో లేరు."
        ]
    },
    "Account or SIM Deactivation Threat": {
        "en": [
            "Do not panic. Banks do not block accounts or PAN cards through third-party web links.",
            "Visit your local bank branch with your passbook if you have any doubts.",
            "Do not click links claiming to update KYC or link PAN."
        ],
        "hi": [
            "घबराएँ नहीं! बैंक कभी भी किसी अनजान वेब लिंक के ज़रिए खाता या पैन कार्ड ब्लॉक नहीं करते।",
            "संदेह होने पर अपनी पासबुक लेकर सीधे अपनी बैंक शाखा जाएं।",
            "KYC अपडेट करने या पैन लिंक करने के नाम पर आए किसी भी लिंक पर क्लिक न करें।"
        ],
        "te": [
            "ఆందోళన చెందవద్దు. బ్యాంకులు థర్డ్ పార్టీ లింక్‌ల ద్వారా ఖాతాలను బ్లాక్ చేయవు.",
            "ఏదైనా సందేహం ఉంటే మీ పాస్‌బుక్‌తో మీ స్థానిక బ్యాంక్ శాఖను సందర్శించండి.",
            "KYC లేదా PAN లింక్ చేయమని వచ్చే లింక్‌లపై క్లిక్ చేయవద్దు."
        ]
    },
    "Unrealistic Reward / Job Offer": {
        "en": [
            "Ignore offers of lotteries, gift cars, or easy daily work-from-home earnings.",
            "No legitimate company pays high wages just for liking YouTube videos or reviewing hotels.",
            "Never pay any 'registration' or 'tax' fee to claim lottery money."
        ],
        "hi": [
            "लॉटरी, मुफ़्त उपहार या घर बैठे आसान कमाई के झांसे में न आएं।",
            "कोई भी असली कंपनी केवल यूट्यूब वीडियो लाइक करने के हज़ारों रुपये नहीं देती।",
            "इनाम पाने के लिए 'रजिस्ट्रेशन' या 'टैक्स' के नाम पर एक भी रुपया न दें।"
        ],
        "te": [
            "లాటరీలు, ఉచిత బహుమతులు లేదా సులభమైన వర్క్ ఫ్రమ్ హోమ్ ఆఫర్లను నమ్మవద్దు.",
            "యూట్యూబ్ వీడియోలు లైక్ చేసినందుకు ఏ సంస్థ వేల రూపాయలు చెల్లించదు.",
            "బహుమతి లేదా లాటరీ క్లెయిమ్ చేసుకోవడానికి ఎలాంటి ఫీజు చెల్లించవద్దు."
        ]
    },
    "Actionable Link for Verification or Payment": {
        "en": [
            "Do not click the link sent in the message to verify or update details.",
            "Open your browser and type the known official website URL directly, or open your official app.",
            "Phishing pages look identical to official sites but steal your passwords and debit card numbers."
        ],
        "hi": [
            "सत्यापन या अपडेट के लिए संदेश में आए लिंक पर क्लिक न करें।",
            "अपने ब्राउज़र में आधिकारिक वेबसाइट का पता सीधे टाइप करें या अपनी आधिकारिक ऐप खोलें।",
            "नकली फ़िशिंग वेबसाइटें बिल्कुल असली जैसी दिखती हैं और आपके पासवर्ड चुरा लेती हैं।"
        ],
        "te": [
            "ధృవీకరణ లేదా వివరాలను అప్‌డేట్ చేయడానికి సందేశంలోని లింక్‌ను క్లిక్ చేయవద్దు.",
            "మీ బ్రౌజర్‌లో అధికారిక వెబ్‌సైట్ చిరునామాను నేరుగా టైప్ చేయండి.",
            "నకిలీ ఫిషింగ్ పేజీలు అసలైన సైట్‌లలాగే కనిపిస్తాయి మరియు మీ వివరాలు దొంగిలిస్తాయి."
        ]
    },
    "Discouraging Independent Verification": {
        "en": [
            "Notice that the sender told you NOT to contact your local office. This is a classic scam warning sign.",
            "Always verify independently with your local office or customer care.",
            "Legitimate organizations encourage you to visit their branches."
        ],
        "hi": [
            "ध्यान दें कि संदेश में स्थानीय कार्यालय से संपर्क न करने को कहा गया है। यह ठगी का स्पष्ट संकेत है।",
            "हमेशा अपने स्थानीय कार्यालय या कस्टमर केयर से स्वतंत्र रूप से पुष्टि करें।",
            "असली संस्थाएं हमेशा अपने आधिकारिक कार्यालय में आने का स्वागत करती हैं।"
        ],
        "te": [
            "స్థానిక కార్యాలయాన్ని సంప్రదించవద్దని సందేశంలో పేర్కొన్నారు. ఇది మోసగాళ్ల స్పష్టమైన సంకేతం.",
            "ఎల్లప్పుడూ మీ స్థానిక కార్యాలయం లేదా అధికారిక కస్టమర్ కేర్‌తో స్వయంగా నిర్ధారించుకోండి.",
            "అసలైన సంస్థలు కస్టమర్లను ఎప్పుడూ కార్యాలయానికి రావాలని ప్రోత్సహిస్తాయి."
        ]
    }
}

GENERAL_SAFE_ACTIONS = {
    "high_concern": {
        "en": [
            "Pause and take a deep breath. Do not rush to respond or transfer money.",
            "If you suspect financial loss has occurred, call the National Cyber Helpline immediately at 1930.",
            "Report the message and block the sender in your messaging app."
        ],
        "hi": [
            "शांत रहें और जल्दबाज़ी में कोई पैसे ट्रांसफर न करें।",
            "यदि आपके खाते से पैसे कट गए हैं, तो तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें।",
            "इस नंबर को अपने फ़ोन में ब्लॉक करें और रिपोर्ट करें।"
        ],
        "te": [
            "ప్రశాంతంగా ఉండండి, కంగారుపడి ఎలాంటి డబ్బు బదిలీ చేయవద్దు.",
            "డబ్బు పోయిందని అనిపిస్తే వెంటనే జాతీయ సైబర్ హెల్ప్‌లైన్ 1930 కు కాల్ చేయండి.",
            "ఈ మెసేజ్‌ను రిపోర్ట్ చేసి నంబర్‌ను బ్లాక్ చేయండి."
        ]
    },
    "needs_verification": {
        "en": [
            "This message contains requests or claims that require manual verification.",
            "Check official contact numbers printed on the back of your bank debit card or paper utility bill.",
            "Never click shortened links (e.g. bit.ly) or enter credentials on unknown web pages."
        ],
        "hi": [
            "इस संदेश में कुछ ऐसी बातें हैं जिनकी पुष्टि करना ज़रूरी है।",
            "अपने बैंक डेबिट कार्ड के पीछे या काग़ज़ी बिल पर लिखे आधिकारिक फ़ोन नंबर पर ही संपर्क करें।",
            "अज्ञात वेब लिंक पर क्लिक न करें और न ही कोई जानकारी भरें।"
        ],
        "te": [
            "ఈ సందేశంలోని వివరాలను స్వయంగా ధృవీకరించుకోవాలి.",
            "మీ బ్యాంక్ డెబిట్ కార్డ్ లేదా పేపర్ బిల్లుపై ఉన్న అధికారిక నంబర్లను మాత్రమే ఉపయోగించండి.",
            "తెలియని వెబ్ లింక్‌లపై క్లిక్ చేయవద్దు మరియు వ్యక్తిగత వివరాలను నమోదు చేయవద్దు."
        ]
    },
    "no_obvious_warning": {
        "en": [
            "No obvious scam patterns were detected in this text.",
            "Important: Automated tools cannot verify sender identity or guarantee safety. Always remain cautious.",
            "If anyone contacts you afterwards demanding money, OTP, or app downloads, treat it with extreme suspicion."
        ],
        "hi": [
            "इस संदेश में कोई स्पष्ट धोखाधड़ी या ख़तरे का संकेत नहीं मिला है।",
            "महत्वपूर्ण: स्वचालित टूल भेजने वाले की पहचान सत्यापित नहीं कर सकते। हमेशा सतर्क रहें।",
            "अगर कोई बाद में कॉल करके आपसे पैसे, OTP या ऐप डाउनलोड करने को कहे, तो कभी न मानें।"
        ],
        "te": [
            "ఈ సందేశంలో ఎటువంటి స్పష్టమైన మోసపూరిత సంకేతాలు కనిపించలేదు.",
            "ముఖ్యమైనది: ఆటోమేటెడ్ టూల్స్ పంపినవారి గుర్తింపును పూర్తిగా హామీ ఇవ్వలేవు. ఎల్లప్పుడూ జాగ్రత్తగా ఉండండి.",
            "తర్వాత ఎవరైనా డబ్బు, OTP లేదా యాప్ డౌన్‌లోడ్ చేయాలని అడిగితే అప్రమత్తంగా ఉండండి."
        ]
    }
}

def generate_action_checklist(categories: List[str], concern_level: str, lang: str = "en") -> List[str]:
    """Assembles a prioritized, deduplicated list of concrete safe next steps."""
    lang_key = "en"
    if lang.lower().startswith("hi"):
        lang_key = "hi"
    elif lang.lower().startswith("te"):
        lang_key = "te"

    actions = []
    for cat in categories:
        if cat in GUIDANCE_CATALOG and lang_key in GUIDANCE_CATALOG[cat]:
            for step in GUIDANCE_CATALOG[cat][lang_key]:
                if step not in actions:
                    actions.append(step)

    level_key = "high_concern"
    if concern_level == "Needs verification":
        level_key = "needs_verification"
    elif concern_level == "No obvious warning signs found":
        level_key = "no_obvious_warning"

    for step in GENERAL_SAFE_ACTIONS[level_key].get(lang_key, GENERAL_SAFE_ACTIONS[level_key]["en"]):
        if step not in actions:
            actions.append(step)

    return actions[:5]

def generate_refusal_script(primary_threat: str, lang: str = "en") -> Dict[str, str]:
    """Generates polite, firm 'Help Me Say No' refusal response scripts in English, Hindi, and Telugu."""
    threat_lower = primary_threat.lower()

    if any(k in threat_lower for k in ["credential", "otp", "pin", "password"]):
        return {
            "en": "My bank and security guidelines strictly forbid sharing OTPs, PINs, or passwords with anyone. I cannot share this code.",
            "hi": "बैंक के सख्त नियमों के अनुसार OTP, PIN या पासवर्ड किसी को बताना मना है। मैं यह कोड साझा नहीं कर सकता।",
            "te": "బ్యాంక్ భద్రతా నిబంధనల ప్రకారం OTP లేదా PIN ఎవరితోనూ పంచుకోకూడదు. నేను ఈ కోడ్‌ను పంచుకోలేను."
        }
    elif any(k in threat_lower for k in ["app", "apk", "remote", "control", "anydesk"]):
        return {
            "en": "I am instructed by my family and bank never to install external apps or screen-sharing software on my phone. I will not download this.",
            "hi": "मुझे बैंक और परिवार ने किसी अनजान APK या स्क्रीन शेयरिंग ऐप को डाउनलोड न करने की हिदायत दी है। मैं कोई ऐप इंस्टॉल नहीं करूँगा।",
            "te": "నా ఫోన్‌లో ఎటువంటి బయటి యాప్‌లు లేదా స్క్రీన్ షేరింగ్ సాఫ్ట్‌వేర్ ఇన్‌స్టాల్ చేయవద్దని నాకు చెప్పారు. నేను దీన్ని డౌన్‌లోడ్ చేయను."
        }
    elif any(k in threat_lower for k in ["utility", "disconnection", "interruption", "electricity", "bill"]):
        return {
            "en": "I will verify my account status directly at the official office with my paper bill. I do not pay charges through text messages or unverified links.",
            "hi": "मैं अपने काग़ज़ी बिल के साथ सीधे आधिकारिक कार्यालय जाकर इसकी जांच करूँगा। मैं संदेश या अनजान लिंक पर कोई भुगतान नहीं करूँगा।",
            "te": "నా పేపర్ బిల్లుతో అధికారిక కార్యాలయానికి వెళ్లి నా ఖాతా స్థితిని స్వయంగా సరిచూసుకుంటాను. నేను సందేశాల ద్వారా ఎటువంటి చెల్లింపులు చేయను."
        }
    elif any(k in threat_lower for k in ["transfer", "money", "fee", "charge", "deposit"]):
        return {
            "en": "I do not transfer money or pay fees based on text messages. If you are an official entity, please send a physical letter to my registered address.",
            "hi": "मैं किसी संदेश या लिंक पर पैसे या फ़ीस नहीं भेजता। यदि यह आवश्यक है, तो मेरे पते पर आधिकारिक पत्र या काग़ज़ी बिल भेजें।",
            "te": "నేను సందేశాల ఆధారంగా ఎవరికీ డబ్బు లేదా ఫీజులు పంపను. ఇది అధికారికమైనదైతే నా చిరునామాకు రాతపూర్వక ఉత్తరం పంపండి."
        }
    elif any(k in threat_lower for k in ["arrest", "legal", "cbi", "police"]):
        return {
            "en": "I know that Indian law does not permit arrests or investigations over phone or video calls. I will report this call to the cybercrime helpline at 1930.",
            "hi": "मुझे मालूम है कि भारतीय क़ानून में फ़ोन या वीडियो कॉल पर गिरफ़्तारी का कोई नियम नहीं है। मैं इस संपर्क की शिकायत 1930 पर करूँगा।",
            "te": "భారతీయ చట్టం ప్రకారం ఫోన్ లేదా వీడియో కాల్ ద్వారా అరెస్ట్ చేయడం చెల్లదని నాకు తెలుసు. నేను దీనిపై 1930 హెల్ప్‌లైన్‌కు ఫిర్యాదు చేస్తాను."
        }
    else:
        return {
            "en": "I cannot take action or transfer funds based on an unverified message. Please call me directly on my normal phone number if you know me.",
            "hi": "मैं बिना पुष्टि के किसी संदेश पर कोई कदम नहीं उठा सकता। यदि आप परिचित हैं, तो कृपया मुझे सीधे फ़ोन पर कॉल करें।",
            "te": "ధృవీకరించని సందేశాల ఆధారంగా నేను ఎలాంటి నిర్ణయం తీసుకోలేను. మీకు నాతో పని ఉంటే నేరుగా సాధారణ ఫోన్ కాల్ చేయండి."
        }

def generate_unknowns(concern_level: str, text: str) -> List[str]:
    """Lists explicit unknowns and unverified aspects to maintain honest uncertainty."""
    unknowns = [
        "The true identity of the sender cannot be verified from the message text alone (SMS headers and phone numbers can be spoofed).",
        "Whether your account, connection, or service actually has a pending issue cannot be determined without checking official records directly."
    ]
    if "http" in text.lower() or "bit.ly" in text.lower():
        unknowns.append("The authenticity and security of the destination web link cannot be guaranteed from text alone.")
    return unknowns

def generate_follow_up_questions(
    matched_actions: List[Dict[str, Any]],
    matched_urgency: List[Dict[str, Any]],
    concern_level: str,
    text: str
) -> List[Dict[str, Any]]:
    """Generates up to 3 relevant follow-up context questions when context is ambiguous."""
    questions = []
    has_money_request = any(a.get("standard_action") == "SEND_MONEY" for a in matched_actions)
    has_threat = any(u.get("standard_action") == "ACCOUNT_OR_SERVICE_THREAT" for u in matched_urgency)

    # Question 1: Do you know the sender?
    questions.append({
        "id": "q_sender_known",
        "question_en": "Do you personally know the person or organization who sent this message?",
        "question_hi": "क्या आप इस संदेश को भेजने वाले व्यक्ति या संस्था को व्यक्तिगत रूप से जानते हैं?",
        "question_te": "ఈ సందేశాన్ని పంపిన వ్యక్తి లేదా సంస్థ మీకు వ్యక్తిగతంగా తెలుసా?",
        "options": [
            {"value": "yes_known", "label_en": "Yes, I know them personally", "label_hi": "हाँ, मैं उन्हें व्यक्तिगत रूप से जानता हूँ", "label_te": "అవును, నాకు వ్యక్తిగతంగా తెలుసు"},
            {"value": "no_unknown", "label_en": "No, it is from an unknown number or stranger", "label_hi": "नहीं, यह किसी अनजान नंबर से आया है", "label_te": "లేదు, ఇది తెలియని నంబర్ నుండి వచ్చింది"},
            {"value": "not_sure", "label_en": "I don't know / Not sure", "label_hi": "मुझे नहीं पता / पक्का नहीं है", "label_te": "నాకు ఖచ్చితంగా తెలియదు"}
        ]
    })

    # Question 2: Independent phone call verification?
    if has_money_request or has_threat:
        questions.append({
            "id": "q_direct_call",
            "question_en": "Have you spoken directly with them on a regular phone call to verify this request?",
            "question_hi": "क्या आपने सीधे फ़ोन कॉल पर बात करके इस अनुरोध की पुष्टि की है?",
            "question_te": "ఈ అభ్యర్థనను నిర్ధారించడానికి మీరు వారితో నేరుగా సాధారణ ఫోన్ కాల్‌లో మాట్లాడారా?",
            "options": [
                {"value": "spoke_directly", "label_en": "Yes, I spoke to them on a phone call", "label_hi": "हाँ, मैंने कॉल पर बात की", "label_te": "అవును, నేను ఫోన్ కాల్‌లో మాట్లాడాను"},
                {"value": "only_message", "label_en": "No, I only received this text message", "label_hi": "नहीं, केवल यह संदेश मिला है", "label_te": "లేదు, నాకు కేవలం ఈ మెసేజ్ మాత్రమే వచ్చింది"},
                {"value": "not_sure", "label_en": "Not yet / Not sure", "label_hi": "अभी नहीं / पक्का नहीं है", "label_te": "ఇంకా లేదు / ఖచ్చితంగా తెలియదు"}
            ]
        })

    # Question 3: Official paper document or portal check?
    questions.append({
        "id": "q_official_bill",
        "question_en": "Did you verify this bill or account status on your official paper bill or physical branch?",
        "question_hi": "क्या आपने अपने काग़ज़ी बिल या बैंक शाखा में जाकर इसकी जांच की है?",
        "question_te": "మీ అధికారిక పేపర్ బిల్లు లేదా బ్యాంక్ బ్రాంచ్‌లో ఈ స్థితిని సరిచూశారా?",
        "options": [
            {"value": "verified_offline", "label_en": "Yes, verified through official physical records", "label_hi": "हाँ, काग़ज़ी बिल या शाखा से जांच की", "label_te": "అవును, అధికారిక రికార్డుల ద్వారా ధృవీకరించాను"},
            {"value": "not_verified_offline", "label_en": "No, relying only on this message", "label_hi": "नहीं, केवल इस संदेश पर निर्भर हूँ", "label_te": "లేదు, కేవలం ఈ సందేశంపై ఆధారపడుతున్నాను"},
            {"value": "not_sure", "label_en": "I don't know / Not sure", "label_hi": "मुझे नहीं पता / पक्का नहीं", "label_te": "తెలియదు / ఖచ్చితంగా లేదు"}
        ]
    })

    return questions[:3]
