"""Central Scam Detection Engine for FINX.

Orchestrates:
1. Input Preprocessing (Text Cleaning, Language Detection, Tokenization)
2. 4-Pillar Scam Detection Engine (Patterns, Impersonation, Suspicious Links, Classification)
3. Risk Assessment (0 - 100 Scoring, Low / Medium / High Risk Zones)
4. Explainable Alert Generation (Verbatim Evidence Quotes, Plain-Language Reasons)
5. Multilingual User Alerts (English, Telugu, Hindi)
6. Actionable Safety Guidance & 1930 Helpline Assistance
7. User Decision Support ('Help Me Say No' scripts, Context Questions)
"""

import time
import re
from typing import Dict, List, Any, Optional

from core.patterns import (
    ACTION_PATTERNS,
    URGENCY_PATTERNS,
    IMPERSONATION_PATTERNS,
    LEGITIMATE_NOTIFICATIONS
)
from core.evidence import EvidenceExtractor
from core.guidance import (
    generate_action_checklist,
    generate_refusal_script,
    generate_unknowns,
    generate_follow_up_questions
)
from core.llm_adapter import LLMAdapter
from core.ml_model import SpamClassifier

class ScamDetector:
    """Core analysis engine implementing the complete ScamShield AI Architecture."""

    def __init__(self, use_ai: bool = True, api_key: Optional[str] = None):
        self.llm_adapter = LLMAdapter(api_key=api_key)
        self.use_ai = use_ai and self.llm_adapter.is_available()
        # Initialize trained ML spam classifier
        self.ml_classifier = SpamClassifier.get_instance()

    def preprocess(self, text: str) -> Dict[str, Any]:
        """Step 2: Preprocessing - Cleans text, detects language, and counts tokens."""
        cleaned = re.sub(r"[\r\n\t]+", " ", text).strip()
        tokens = cleaned.split()

        # Detect Telugu (Unicode range U+0C00 - U+0C7F)
        has_telugu = bool(re.search(r"[\u0C00-\u0C7F]", text))
        # Detect Devanagari / Hindi (Unicode range U+0900 - U+097F)
        has_hindi = bool(re.search(r"[\u0900-\u097F]", text))

        if has_telugu:
            detected_lang = "te"
            detected_lang_label = "Telugu (తెలుగు)"
        elif has_hindi:
            detected_lang = "hi"
            detected_lang_label = "Hindi (हिन्दी)"
        else:
            detected_lang = "en"
            detected_lang_label = "English"

        # Extract links
        links = re.findall(r"https?://[^\s/$.?#].[^\s]*", text)

        return {
            "cleaned_text": cleaned,
            "char_count": len(text),
            "token_count": len(tokens),
            "links_found": links,
            "detected_language": detected_lang,
            "detected_language_label": detected_lang_label
        }

    def analyze(
        self,
        raw_text: str,
        language: str = "en",
        force_local: bool = False,
        user_context: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Runs the complete 9-step analysis pipeline and returns the full diagnostic report."""
        start_time = time.perf_counter()

        if not raw_text or not raw_text.strip():
            return self._empty_result(language)

        text = raw_text.strip()
        ctx = user_context or {}

        # 1. Preprocessing
        pre = self.preprocess(text)
        req_lang = language.lower()

        # 1b. ML Spam Classifier Prediction (5th pillar)
        ml_result = self.ml_classifier.predict(text)

        # 2. Extract matched evidence across 4 pillars
        raw_evidence = []
        matched_actions = []
        matched_urgency = []
        matched_impersonations = []

        # Pillar 1 & 2: Dangerous Actions and Urgency Patterns
        for p in ACTION_PATTERNS:
            matches = EvidenceExtractor.extract_matches(text, p)
            if matches:
                raw_evidence.extend(matches)
                matched_actions.append(p)

        for p in URGENCY_PATTERNS:
            matches = EvidenceExtractor.extract_matches(text, p)
            if matches:
                raw_evidence.extend(matches)
                matched_urgency.append(p)

        # Pillar 3: Impersonation Detection
        for p in IMPERSONATION_PATTERNS:
            matches = EvidenceExtractor.extract_matches(text, p)
            if matches:
                matched_impersonations.append(p)

        # Legitimate transactional signals
        legit_matches = []
        for p in LEGITIMATE_NOTIFICATIONS:
            m = EvidenceExtractor.extract_matches(text, p)
            if m:
                legit_matches.extend(m)
        has_legit_signals = bool(legit_matches)

        # Deduplicate and sort evidence quotes
        evidence_list = EvidenceExtractor.deduplicate_and_merge_spans(raw_evidence)

        # Map standard actions
        standard_action_set = set()
        for ev in evidence_list:
            act = ev.get("standard_action")
            if act and act != "OTHER_OR_UNCLEAR":
                standard_action_set.add(act)
        requested_actions = sorted(list(standard_action_set))
        if not requested_actions:
            requested_actions = ["OTHER_OR_UNCLEAR"]

        # 3. Determine Concern Level, Primary Threat, and Plain-Language Reasons
        concern_level, primary_threat, summary_en, summary_hi, summary_te, reasons, risk_score = self._determine_verdict(
            matched_actions=matched_actions,
            matched_urgency=matched_urgency,
            matched_impersonations=matched_impersonations,
            has_legit_signals=has_legit_signals,
            legit_matches=legit_matches,
            evidence_count=len(evidence_list),
            text=text,
            user_context=ctx
        )

        # 4. Extract Category names for guidance
        categories = list(set(ev["category"] for ev in evidence_list))

        # 5. Safe Next Actions
        safe_actions = generate_action_checklist(
            categories=categories,
            concern_level=concern_level,
            lang=req_lang
        )

        # 6. Generate safely highlighted HTML
        highlighted_html = EvidenceExtractor.generate_highlighted_html(text, evidence_list)

        # 7. Unknowns & Honesty declaration
        unknowns = generate_unknowns(concern_level, text)

        # 8. Help Me Say No refusal script (English, Hindi, Telugu)
        help_me_say_no = generate_refusal_script(primary_threat, lang=req_lang)

        # 9. Follow-up Context Questions (up to 3)
        follow_up_questions = generate_follow_up_questions(
            matched_actions=matched_actions,
            matched_urgency=matched_urgency,
            concern_level=concern_level,
            text=text
        )

        # Check if external AI enhancement should be used
        engine_used = "local_rules"
        ai_reason = None

        if self.use_ai and not force_local and concern_level != "No obvious warning signs found":
            ai_res = self.llm_adapter.analyze_message(text, lang=req_lang)
            if not ai_res.get("fallback_required", False):
                engine_used = "ai_enhanced"
                if req_lang.startswith("hi"):
                    summary_hi = ai_res.get("simple_explanation", summary_hi)
                elif req_lang.startswith("te"):
                    summary_te = ai_res.get("simple_explanation", summary_te)
                else:
                    summary_en = ai_res.get("simple_explanation", summary_en)

                if ai_res.get("safe_next_actions"):
                    safe_actions = ai_res["safe_next_actions"][:4]
            else:
                ai_reason = ai_res.get("reason")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Pick summary based on requested language
        if req_lang.startswith("hi"):
            display_summary = summary_hi
        elif req_lang.startswith("te"):
            display_summary = summary_te
        else:
            display_summary = summary_en

        # Architecture 5-pillar detection breakdown
        engine_breakdown = {
            "keyword_pattern_matching": {
                "matched_count": len(matched_actions) + len(matched_urgency),
                "patterns": [a["category"] for a in matched_actions] + [u["category"] for u in matched_urgency]
            },
            "impersonation_detection": {
                "detected": bool(matched_impersonations),
                "entities": [i["category"] for i in matched_impersonations]
            },
            "suspicious_link_analysis": {
                "links_found": pre["links_found"],
                "has_suspicious_link": any(a.get("id") in ("action_verification_link", "suspicious_shortlink") for a in matched_actions)
            },
            "ml_spam_classifier": {
                "spam_probability": ml_result.get("spam_probability", 0.0),
                "spam_percentage": ml_result.get("spam_percentage", 0.0),
                "is_spam": ml_result.get("is_spam", False),
                "confidence": ml_result.get("confidence", "None"),
                "model_type": ml_result.get("model_type", "N/A"),
                "top_signals": ml_result.get("top_signals", [])
            },
            "classification_engine": {
                "mode": engine_used,
                "confidence": "High" if len(evidence_list) >= 2 else ("Medium" if evidence_list else "Low")
            },
            "ai_provider": self.llm_adapter.get_provider_info()
        }

        # Step 6: User Alert Card texts
        user_alert = {
            "en": "This message is likely a scam. Do not share your OTP or click on any links." if concern_level == "High concern" else ("This message requires manual verification. Double check official channels." if concern_level == "Needs verification" else "No obvious scam signs detected. Always stay vigilant."),
            "te": "ఈ సందేశం మోసపూరితంగా ఉండే అవకాశం ఉంది. మీ OTP ను ఎవరితోనూ పంచుకోవద్దు మరియు లింక్ పై క్లిక్ చేయవద్దు." if concern_level == "High concern" else ("ఈ సందేశాన్ని స్వయంగా ధృవీకరించుకోవాలి. అధికారిక మూలాలను మాత్రమే సంప్రదించండి." if concern_level == "Needs verification" else "ఎటువంటి స్పష్టమైన మోసపూరిత సంకేతాలు కనిపించలేదు. అప్రమత్తంగా ఉండండి."),
            "hi": "सावधान! इस संदेश में धोखाधड़ी की आशंका है। अपना OTP कभी किसी को न बताएं और किसी लिंक पर क्लिक न करें।" if concern_level == "High concern" else ("इस संदेश में दी गई जानकारी की पुष्टि आवश्यक है। केवल आधिकारिक स्रोतों से संपर्क करें।" if concern_level == "Needs verification" else "इस संदेश में कोई स्पष्ट खतरा नहीं मिला। सतर्क रहें।")
        }

        return {
            "status": "success",
            "analysis_mode": "ai_assisted" if engine_used == "ai_enhanced" else "rule_based",
            "concern_level": concern_level,
            "risk_score": risk_score,
            "risk_category": "High Risk (71 - 100)" if risk_score > 70 else ("Medium Risk (31 - 70)" if risk_score >= 31 else "Low Risk (0 - 30)"),
            "concern_badge": {
                "en": self._badge_text(concern_level, "en"),
                "hi": self._badge_text(concern_level, "hi"),
                "te": self._badge_text(concern_level, "te")
            },
            "primary_threat": primary_threat,
            "requested_actions": requested_actions,
            "evidence": evidence_list,
            "reasons": reasons,
            "unknowns": unknowns,
            "safe_next_actions": safe_actions,
            "help_me_say_no_script": help_me_say_no,
            "follow_up_questions": follow_up_questions,
            "user_context": ctx,
            "summary": display_summary,
            "summary_en": summary_en,
            "summary_hi": summary_hi,
            "summary_te": summary_te,
            "user_alert": user_alert,
            "preprocessing": pre,
            "engine_breakdown": engine_breakdown,
            "ml_spam_prediction": ml_result,
            "ai_provider": self.llm_adapter.get_provider_info(),
            "highlighted_html": highlighted_html,
            "language": req_lang,
            "engine_used": engine_used,
            "engine_note": ai_reason if ai_reason else ("Offline Local Engine (Zero Cloud Transmission)" if engine_used == "local_rules" else "AI-Enhanced Analysis"),
            "latency_ms": elapsed_ms,
            "disclaimer": {
                "en": "Advisory only. This assessment does not verify the sender's identity. Never share passwords, PINs, or OTPs.",
                "hi": "यह केवल सलाह है। यह जांच भेजने वाले की पहचान सत्यापित नहीं करती। पासवर्ड, PIN या OTP कभी किसी से साझा न करें।",
                "te": "ఇది కేవలం సమాచారం మాత్రమే. పంపినవారి గుర్తింపును ఇది ధృవీకరించదు. పాస్‌వర్డ్స్ లేదా OTP ఎవరితోనూ పంచుకోవద్దు."
            }
        }

    def _determine_verdict(
        self,
        matched_actions: List[Dict[str, Any]],
        matched_urgency: List[Dict[str, Any]],
        matched_impersonations: List[Dict[str, Any]],
        has_legit_signals: bool,
        legit_matches: List[Dict[str, Any]],
        evidence_count: int,
        text: str,
        user_context: Dict[str, str]
    ):
        """Calculates honest concern level and risk score (0 - 100) based on observable signals."""
        has_critical_action = any(a.get("severity") == "CRITICAL" for a in matched_actions)
        has_critical_urgency = any(u.get("severity") == "CRITICAL" for u in matched_urgency)
        reasons = []

        # Scenario A: Critical Threat (e.g. OTP demanded, APK install, AnyDesk, Digital Arrest)
        if has_critical_action or has_critical_urgency:
            primary = matched_actions[0]["category"] if matched_actions else matched_urgency[0]["category"]
            reasons.append("Demands a highly dangerous action (such as disclosing an OTP, installing an app, or screen-sharing).")
            if has_critical_urgency:
                reasons.append("Employs coercive pressure or fake legal threats.")
            if matched_impersonations:
                reasons.append(f"Impersonates official authority: {matched_impersonations[0]['category']}.")
            return (
                "High concern",
                primary,
                "Warning: This message shows strong patterns of an active scam. It demands dangerous actions (such as downloading files, screen sharing, or credentials) under coercive pressure.",
                "सावधान: इस संदेश में धोखाधड़ी (स्कैम) के गंभीर संकेत मिले हैं। इसमें दबाव डालकर खतरनाक ऐप डाउनलोड करने, OTP मांगने या पैसे भेजने की मांग की गई है।",
                "హెచ్చరిక: ఈ సందేశంలో మోసపూరిత సంకేతాలు చాలా బలంగా ఉన్నాయి. అనుమానాస్పద యాప్‌ను డౌన్‌లోడ్ చేయడం, OTP పంచుకోవడం లేదా ఒత్తిడితో డబ్బు పంపాలని అడుగుతోంది.",
                reasons,
                94
            )

        # Scenario B: High Urgency / Threat combined with an Action, Link, or Fee
        # (e.g., electricity cutoff + deadline + fee/link)
        has_service_threat = any(u.get("id") in ("service_interruption_threat", "account_sim_kyc_block") for u in matched_urgency)
        has_payment_action = any(a.get("id") == "urgent_unverified_transfer" for a in matched_actions)
        has_action_link = any(a.get("id") in ("action_verification_link", "suspicious_shortlink") for a in matched_actions)
        has_deadline = any(u.get("id") == "deadline_pressure" for u in matched_urgency)

        if has_service_threat and (has_payment_action or has_action_link or has_deadline or len(matched_actions) > 0):
            primary = "Utility Disconnection & Payment Verification Trap"
            reasons.append("Threatens abrupt service interruption or account suspension.")
            if has_deadline:
                reasons.append("Creates artificial deadline pressure (e.g. 'by today' or a specific hour).")
            if has_payment_action:
                reasons.append("Requests a payment or 'refundable verification charge'.")
            if has_action_link:
                reasons.append("Directs you to click an unverified web link for account verification.")
            return (
                "High concern",
                primary,
                "Warning: This message combines service disconnection threats with demands for payment verification or web link clicks. Real utilities do not cut power via SMS or charge verification fees.",
                "चेतावनी: इस संदेश में बिजली या सेवा बंद करने की धमकी देकर फ़ीस भरने या लिंक पर क्लिक करने को कहा जा रहा है। असली कंपनियाँ कभी अचानक SMS से सेवा नहीं काटतीं।",
                "హెచ్చరిక: ఈ సందేశంలో విద్యుత్ లేదా సేవలను నిలిపివేస్తామని బెదిరిస్తూ ధృవీకరణ లింక్‌లు లేదా ఛార్జీలను అడుగుతోంది. నిజమైన సంస్థలు ఎప్పుడూ ఇలా చేయవు.",
                reasons,
                88
            )

        # Scenario Ambiguous: Informal Money Request (e.g. "Hi, can you send ₹500?")
        is_informal_money_request = (
            any(a.get("id") == "urgent_unverified_transfer" for a in matched_actions)
            and not has_critical_action
            and not has_critical_urgency
            and not has_service_threat
            and not has_action_link
            and not matched_impersonations
            and not any(u.get("id") == "lottery_job_subsidy" for u in matched_urgency)
            and not any(a.get("id") == "discourage_independent_verification" for a in matched_actions)
        )
        if is_informal_money_request:
            reasons.append("Identified a request to transfer or send money.")
            reasons.append("Urgency or immediate need expressed.")
            reasons.append("Insufficient context: Sender identity and relationship cannot be verified from text alone.")

            if user_context.get("q_sender_known") == "no_unknown":
                reasons.append("User indicated the sender is unknown. Transferring money to unknown contacts is high risk.")
                return (
                    "High concern",
                    "Unverified Payment Request from Unknown Sender",
                    "Warning: This message requests money from an unknown sender. Never transfer money to unknown numbers.",
                    "चेतावनी: यह संदेश किसी अनजान व्यक्ति से पैसे भेजने का अनुरोध करता है। अनजान नंबरों पर कभी पैसे न भेजें।",
                    "హెచ్చరిక: తెలియని వ్యక్తి లేదా నంబర్ నుండి డబ్బు బదిలీ అభ్యర్థన వచ్చింది. తెలియని వారికి డబ్బు పంపడం చాలా ప్రమాదకరం.",
                    reasons,
                    82
                )
            elif user_context.get("q_direct_call") == "spoke_directly":
                reasons.append("User confirmed speaking directly with the requester on a phone call.")
                return (
                    "Needs verification",
                    "Directly Verified Contact Request",
                    "You indicated that you verified this request directly with the sender on a phone call. Always double check account details before sending.",
                    "आपने पुष्टि की है कि आपने फ़ोन कॉल पर सीधे बात की है। फिर भी पैसे भेजने से पहले खाता विवरण अवश्य जांच लें।",
                    "మీరు ఫోన్ కాల్‌లో మాట్లాడి ధృవీకరించినట్లు తెలిపారు. డబ్బు పంపే ముందు బ్యాంక్ ఖాతా వివరాలను మళ్ళీ సరిచూసుకోండి.",
                    reasons,
                    45
                )
            else:
                return (
                    "Needs verification",
                    "Ambiguous Payment Request",
                    "This message requests money urgently. Because messages can be spoofed or accounts compromised, verify by directly calling the sender on their known phone number before sending any money.",
                    "इस संदेश में तत्काल पैसे भेजने का अनुरोध है। चूंकि कोई भी फर्जी संदेश भेज सकता है, पैसे भेजने से पहले संबंधित व्यक्ति को सीधे फ़ोन करके पुष्टि करें।",
                    "ఈ సందేశంలో తక్షణ డబ్బు అభ్యర్థన ఉంది. డబ్బు పంపే ముందు తెలిసిన సాధారణ ఫోన్ నంబర్‌కు కాల్ చేసి నిర్ధారించుకోండి.",
                    reasons,
                    55
                )

        # Scenario B2: Multiple suspicious indicators together
        if (len(matched_actions) + len(matched_urgency)) >= 2:
            primary_cat = matched_actions[0]["category"] if matched_actions else matched_urgency[0]["category"]
            primary = f"Multiple Warning Signals ({primary_cat})"
            reasons.append("Multiple suspicious patterns detected in the message.")
            if matched_actions:
                reasons.append(f"Requested action: {matched_actions[0]['category']}.")
            if matched_urgency:
                reasons.append(f"Urgency indicator: {matched_urgency[0]['category']}.")
            return (
                "High concern",
                primary,
                "Warning: Multiple scam indicators were detected in this message (such as fee demands, personal phone numbers, or obfuscated links).",
                "चेतावनी: इस संदेश में एक से अधिक संदिग्ध संकेत पाए गए हैं (जैसे फ़ीस मांगना, व्यक्तिगत नंबर या अनजान लिंक)।",
                "హెచ్చరిక: ఈ సందేశంలో బహుళ అనుమానాస్పద సంకేతాలు ఉన్నాయి (ఫీజు అభ్యర్థనలు లేదా తెలియని లింక్‌లు).",
                reasons,
                78
            )

        # Scenario C: Utility Disconnection alone without other actions
        if any(u.get("id") == "service_interruption_threat" for u in matched_urgency):
            reasons.append("Threatens disconnection or service cutoff via an unverified text message.")
            return (
                "High concern",
                "Fake Utility Disconnection Threat",
                "Warning: Utility distribution companies never threaten immediate disconnections via SMS or provide personal contacts for payment.",
                "चेतावनी: बिजली विभाग कभी भी अचानक ऐसे SMS भेजकर तुरंत बिजली काटने की धमकी नहीं देता।",
                "హెచ్చరిక: విద్యుత్ సంస్థలు అకస్మాత్తుగా SMS పంపి వెంటనే సరఫరా ఆపివేస్తామని బెదిరించవు.",
                reasons,
                76
            )

        # Scenario D: Legitimate Informational Notification (Bank OTP warning or routine bill)
        if has_legit_signals and not matched_actions and not has_service_threat:
            has_bill_reminder = any(m.get("id") == "routine_bill_notice" for m in legit_matches)
            if has_bill_reminder:
                reasons.append("Contains standard informational bill notification directing you to your normal app.")
                reasons.append("Does not demand payment to unknown numbers, links, or APK downloads.")
                return (
                    "No obvious warning signs found",
                    "Routine Service Bill Reminder",
                    "This appears to be a routine service bill reminder directing you to your normal app. No obvious scam signals were found. Sender identity remains unverified.",
                    "यह एक सामान्य बिल सूचना प्रतीत होती है जो आपको अपनी सामान्य ऐप पर जाने को कहती है। इसमें कोई संदिग्ध मांग नहीं मिली है।",
                    "ఇది సాధారణ బిల్లు సమాచార సందేశంగా కనిపిస్తోంది. మీ సాధారణ యాప్ ద్వారా చెల్లించవచ్చు. ఎటువంటి మోసపూరిత సంకేతాలు కనిపించలేదు.",
                    reasons,
                    15
                )
            else:
                reasons.append("Contains standard informational bank formatting.")
                reasons.append("Explicitly instructs the recipient NOT to share the code with anyone.")
                return (
                    "No obvious warning signs found",
                    "Standard Transactional Notification",
                    "This appears to be a standard informational bank alert or security notification. Note: Legitimate banks advise you NEVER to share your OTP with anyone.",
                    "यह एक सामान्य बैंक सूचना या OTP संदेश प्रतीत होता है। याद रखें: असली बैंक कभी भी आपसे यह OTP किसी को बताने के लिए नहीं कहता।",
                    "ఇది సాధారణ బ్యాంక్ నోటిఫికేషన్ లేదా OTP అలర్ట్. గుర్తుంచుకోండి: బ్యాంక్ ఎప్పుడూ OTP ని అడగదు.",
                    reasons,
                    10
                )

        # Scenario E: Isolated indicator
        if matched_actions or matched_urgency:
            primary_cat = matched_actions[0]["category"] if matched_actions else matched_urgency[0]["category"]
            reasons.append(f"Identified signal: {primary_cat}.")
            reasons.append("Sender identity and relationship cannot be verified from message text alone.")

            if user_context.get("q_sender_known") == "no_unknown":
                reasons.append("User confirmed that the sender is unknown. Transferring money to unknown contacts is high risk.")
                return (
                    "High concern",
                    "Unverified Payment Request from Unknown Sender",
                    "Warning: This message asks for money from an unknown sender. Never send money to unknown individuals.",
                    "चेतावनी: यह संदेश किसी अनजान व्यक्ति से पैसे भेजने का अनुरोध करता है। अनजान नंबरों पर कभी पैसे न भेजें।",
                    "హెచ్చరిక: తెలియని వ్యక్తి నుండి అభ్యర్థన వచ్చింది. ఎవరికీ ధృవీకరించకుండా డబ్బు పంపవద్దు.",
                    reasons,
                    74
                )

            return (
                "Needs verification",
                primary_cat,
                "This message contains a payment request, link, or claim that cannot be verified from text alone. Verify through official channels or call the sender directly before taking action.",
                "इस संदेश में पैसे या लिंक का ऐसा अनुरोध है जिसकी पुष्टि केवल संदेश से नहीं हो सकती। कोई भी कदम उठाने से पहले सीधे कॉल करके या आधिकारिक स्रोत से पुष्टि करें।",
                "ఈ సందేశంలోని వివరాలను కేవలం వచనం ఆధారంగా ధృవీకరించలేము. అధికారిక మూలాల ద్వారా ధృవీకరించుకోండి.",
                reasons,
                48
            )

        # Scenario F: Clean message
        reasons.append("No common scam keywords, urgent threats, credential demands, or malicious links detected.")
        reasons.append("Sender identity cannot be confirmed by automated text analysis alone.")
        return (
            "No obvious warning signs found",
            "No Known Scam Patterns",
            "No obvious scam patterns were detected in this message. However, no automated tool can guarantee safety. Always verify sender identity independently.",
            "इस संदेश में किसी ज्ञात धोखाधड़ी का कोई संकेत नहीं मिला। फिर भी सतर्क रहें, क्योंकि कोई भी स्वचालित टूल पूर्ण सुरक्षा की गारंटी नहीं दे सकता।",
            "ఈ సందేశంలో ఎటువంటి స్పష్టమైన మోసపూరిత సంకేతాలు కనిపించలేదు. అయినప్పటికీ జాగ్రత్తగా ఉండండి.",
            reasons,
            12
        )

    def _badge_text(self, concern_level: str, lang: str) -> str:
        """Returns localized badge text."""
        if concern_level == "High concern":
            if lang == "hi":
                return "उच्च जोखिम / ख़तरा (High Concern)"
            elif lang == "te":
                return "అధిక ప్రమాదం (High Concern)"
            return "High Concern"
        elif concern_level == "Needs verification":
            if lang == "hi":
                return "सत्यापन आवश्यक (Needs Verification)"
            elif lang == "te":
                return "ధృవీకరణ అవసరం (Needs Verification)"
            return "Needs Verification"
        else:
            if lang == "hi":
                return "कोई स्पष्ट ख़तरा नहीं (Low Risk)"
            elif lang == "te":
                return "తక్కువ ప్రమాదం (Low Risk)"
            return "No Obvious Warning Signs Found"

    def _empty_result(self, language: str) -> Dict[str, Any]:
        """Safe return for empty or whitespace-only input."""
        lang_is_hi = language.lower().startswith("hi")
        lang_is_te = language.lower().startswith("te")

        if lang_is_te:
            summary = "దయచేసి విశ్లేషించడానికి సందేశం లేదా కాల్ వివరాలను నమోదు చేయండి."
        elif lang_is_hi:
            summary = "कृपया विश्लेषण के लिए कोई संदेश या कॉल विवरण पेस्ट करें।"
        else:
            summary = "Please enter or paste a message to analyze."

        return {
            "status": "empty",
            "analysis_mode": "rule_based",
            "concern_level": "Needs verification",
            "risk_score": 0,
            "risk_category": "Low Risk (0 - 30)",
            "concern_badge": {
                "en": "Empty Input",
                "hi": "खाली इनपुट",
                "te": "ఖాళీ ఇన్‌పుట్"
            },
            "primary_threat": "No Input Provided",
            "requested_actions": ["OTHER_OR_UNCLEAR"],
            "evidence": [],
            "reasons": ["No message text was provided for analysis."],
            "unknowns": ["No input provided."],
            "summary": summary,
            "summary_en": "Please enter or paste a message to analyze.",
            "summary_hi": "कृपया विश्लेषण के लिए कोई संदेश या कॉल विवरण पेस्ट करें।",
            "summary_te": "దయచేసి విశ్లేషించడానికి సందేశం లేదా కాల్ వివరాలను నమోదు చేయండి.",
            "highlighted_html": "",
            "safe_next_actions": [
                "Paste the suspicious SMS, WhatsApp message, or call transcript."
            ],
            "help_me_say_no_script": {
                "en": "I cannot take action without verifying.",
                "hi": "मैं बिना पुष्टि के कोई कार्रवाई नहीं कर सकता।",
                "te": "ధృవీకరించకుండా నేను ఎటువంటి చర్య తీసుకోలేను."
            },
            "follow_up_questions": [],
            "user_context": {},
            "language": language,
            "engine_used": "local_rules",
            "engine_note": "Offline Local Engine",
            "latency_ms": 0.0,
            "disclaimer": {
                "en": "Advisory only. This assessment does not verify the sender's identity.",
                "hi": "यह केवल सलाह है। यह जांच भेजने वाले की पहचान सत्यापित नहीं करती।",
                "te": "ఇది కేవలం సమాచారం మాత్రమే. పంపినవారి గుర్తింపును ఇది ధృవీకరించదు."
            }
        }
