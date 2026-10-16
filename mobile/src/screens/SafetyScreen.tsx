import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import type { Language } from "../types/scam";

interface SafetyScreenProps {
  language: Language;
}

const content = {
  en: [
    ["OTP fraud", "Never share an OTP, PIN, password, or recovery code, even with someone claiming to be bank staff."],
    ["Phishing", "Unexpected links can lead to lookalike sign-in pages. Visit the known official site or app yourself."],
    ["Banking fraud", "Do not install apps or disclose card details to resolve a claimed account problem."],
    ["Fake customer support", "Find support details on the official website or payment card; do not trust unsolicited callers."],
    ["Investment scams", "Be cautious of guaranteed returns, pressure to invest quickly, or requests to pay into personal accounts."],
    ["Fake rewards", "A genuine prize should not require an unexpected fee, OTP, or bank password to release it."],
    ["Suspicious job offers", "Verify employers independently and be wary of upfront fees or requests for sensitive documents."],
    ["Impersonation", "Verify unexpected requests by calling the person or organization using a trusted number."],
    ["Payment fraud", "Check the payee and amount before approving a UPI collect request or scanning a payment QR code."],
  ],
  te: [
    ["OTP మోసం", "బ్యాంకు సిబ్బంది అని చెప్పినా OTP, PIN, పాస్‌వర్డ్ లేదా రికవరీ కోడ్‌ను ఎవరికీ చెప్పకండి."],
    ["ఫిషింగ్", "అనుకోని లింకులు నకిలీ లాగిన్ పేజీలకు తీసుకెళ్లవచ్చు. అధికారిక వెబ్‌సైట్ లేదా యాప్‌ను మీరే తెరవండి."],
    ["బ్యాంకింగ్ మోసం", "ఖాతా సమస్య పరిష్కారమంటూ యాప్ ఇన్‌స్టాల్ చేయమన్నా లేదా కార్డు వివరాలు అడిగినా నమ్మకండి."],
    ["నకిలీ కస్టమర్ సపోర్ట్", "అధికారిక వెబ్‌సైట్ లేదా కార్డులోని సంప్రదింపు వివరాలను ఉపయోగించండి; అనుకోని కాలర్లను నమ్మకండి."],
    ["పెట్టుబడి మోసాలు", "ఖచ్చితమైన లాభాల హామీలు, త్వరగా పెట్టుబడి పెట్టమనే ఒత్తిడి, వ్యక్తిగత ఖాతాలకు చెల్లింపులపై జాగ్రత్త."],
    ["నకిలీ బహుమతులు", "బహుమతి పొందడానికి అనుకోని రుసుము, OTP లేదా బ్యాంకు పాస్‌వర్డ్ అవసరం ఉండదు."],
    ["అనుమానాస్పద ఉద్యోగాలు", "ఉద్యోగ సంస్థను స్వతంత్రంగా ధృవీకరించండి; ముందస్తు రుసుములు లేదా సున్నితమైన పత్రాల అభ్యర్థనలపై జాగ్రత్త."],
    ["వ్యక్తి/సంస్థ వేషధారణ", "అనుకోని అభ్యర్థనను నమ్మకమైన నంబర్‌కు మీరే కాల్ చేసి నిర్ధారించండి."],
    ["చెల్లింపు మోసం", "UPI కలెక్ట్ అభ్యర్థన ఆమోదించే ముందు లేదా QR కోడ్ స్కాన్ చేసే ముందు చెల్లింపుదారుని, మొత్తాన్ని తనిఖీ చేయండి."],
  ],
  hi: [
    ["OTP धोखाधड़ी", "बैंक कर्मचारी होने का दावा करने वाले व्यक्ति को भी OTP, PIN, पासवर्ड या रिकवरी कोड न बताएँ।"],
    ["फ़िशिंग", "अनपेक्षित लिंक नकली साइन-इन पेज खोल सकते हैं। आधिकारिक साइट या ऐप स्वयं खोलें।"],
    ["बैंकिंग धोखाधड़ी", "खाते की समस्या ठीक करने के नाम पर ऐप इंस्टॉल न करें और कार्ड की जानकारी न दें।"],
    ["नकली ग्राहक सहायता", "सहायता विवरण आधिकारिक साइट या कार्ड से लें; अनचाही कॉल पर भरोसा न करें।"],
    ["निवेश घोटाले", "गारंटीड मुनाफ़े, जल्दी निवेश के दबाव और निजी खातों में भुगतान से सावधान रहें।"],
    ["नकली इनाम", "असली इनाम पाने के लिए अनपेक्षित शुल्क, OTP या बैंक पासवर्ड की ज़रूरत नहीं होती।"],
    ["संदिग्ध नौकरी", "नियोक्ता की स्वतंत्र रूप से पुष्टि करें; अग्रिम शुल्क और संवेदनशील दस्तावेज़ माँगने पर सावधान रहें।"],
    ["नकल करके धोखा", "अनपेक्षित अनुरोध की पुष्टि किसी विश्वसनीय नंबर पर स्वयं कॉल करके करें।"],
    ["भुगतान धोखाधड़ी", "UPI कलेक्ट अनुरोध स्वीकारने या QR कोड स्कैन करने से पहले प्राप्तकर्ता और राशि जाँचें।"],
  ],
  ta: [
    ["OTP மோசடி", "வங்கி ஊழியர் என்று கூறுபவரிடமும் OTP, PIN, கடவுச்சொல் அல்லது மீட்புக் குறியீட்டைப் பகிர வேண்டாம்."],
    ["ஃபிஷிங்", "எதிர்பாராத இணைப்புகள் போலியான உள்நுழைவு பக்கங்களுக்கு அழைத்துச் செல்லலாம். அதிகாரப்பூர்வ தளம் அல்லது செயலியை நீங்களே திறக்கவும்."],
    ["வங்கி மோசடி", "கணக்குச் சிக்கலைத் தீர்ப்பதாகக் கூறி செயலியை நிறுவவோ அட்டை விவரங்களைப் பகிரவோ வேண்டாம்."],
    ["போலி வாடிக்கையாளர் சேவை", "அதிகாரப்பூர்வ தளம் அல்லது அட்டையில் உள்ள தொடர்பு விவரங்களைப் பயன்படுத்தவும்."],
    ["முதலீட்டு மோசடிகள்", "உறுதியான லாபம், விரைவாக முதலீடு செய்யும் அழுத்தம், தனிப்பட்ட கணக்கில் பணம் செலுத்தும் கோரிக்கை குறித்து எச்சரிக்கையாக இருங்கள்."],
    ["போலி வெகுமதிகள்", "உண்மையான பரிசைப் பெற எதிர்பாராத கட்டணம், OTP அல்லது வங்கி கடவுச்சொல் தேவையில்லை."],
    ["சந்தேகமான வேலை வாய்ப்புகள்", "வேலை வழங்குநரைத் தனியாகச் சரிபார்க்கவும்; முன்பணம் அல்லது முக்கிய ஆவணக் கோரிக்கைகளில் கவனம்."],
    ["ஆள்மாறாட்டம்", "நம்பகமான எண்ணுக்கு நீங்களே அழைத்து எதிர்பாராத கோரிக்கையை உறுதிப்படுத்தவும்."],
    ["பணம் செலுத்தும் மோசடி", "UPI கோரிக்கையை ஏற்கும் அல்லது QR குறியீட்டை ஸ்கேன் செய்யும் முன் பெறுநரையும் தொகையையும் சரிபார்க்கவும்."],
  ],
  kn: [
    ["OTP ವಂಚನೆ", "ಬ್ಯಾಂಕ್ ಸಿಬ್ಬಂದಿ ಎಂದು ಹೇಳಿಕೊಂಡರೂ OTP, PIN, ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಮರುಪಡೆಯುವ ಕೋಡ್ ಹಂಚಬೇಡಿ."],
    ["ಫಿಶಿಂಗ್", "ಅನಿರೀಕ್ಷಿತ ಲಿಂಕ್‌ಗಳು ನಕಲಿ ಸೈನ್-ಇನ್ ಪುಟಗಳಿಗೆ ಕರೆದೊಯ್ಯಬಹುದು. ಅಧಿಕೃತ ಸೈಟ್ ಅಥವಾ ಆಪ್ ಅನ್ನು ನೀವೇ ತೆರೆಯಿರಿ."],
    ["ಬ್ಯಾಂಕಿಂಗ್ ವಂಚನೆ", "ಖಾತೆ ಸಮಸ್ಯೆ ಪರಿಹರಿಸುವುದಾಗಿ ಹೇಳಿ ಆಪ್ ಸ್ಥಾಪಿಸಲು ಅಥವಾ ಕಾರ್ಡ್ ವಿವರ ನೀಡಲು ಒತ್ತಾಯಿಸಿದರೆ ನಂಬಬೇಡಿ."],
    ["ನಕಲಿ ಗ್ರಾಹಕ ಬೆಂಬಲ", "ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಕಾರ್ಡ್‌ನಲ್ಲಿರುವ ಸಂಪರ್ಕ ವಿವರ ಬಳಸಿ."],
    ["ಹೂಡಿಕೆ ವಂಚನೆಗಳು", "ಖಚಿತ ಲಾಭ, ತ್ವರಿತ ಹೂಡಿಕೆ ಒತ್ತಡ ಅಥವಾ ವೈಯಕ್ತಿಕ ಖಾತೆಗೆ ಹಣ ಪಾವತಿಸಲು ಕೇಳುವುದರ ಬಗ್ಗೆ ಎಚ್ಚರಿಕೆ."],
    ["ನಕಲಿ ಬಹುಮಾನಗಳು", "ನಿಜವಾದ ಬಹುಮಾನಕ್ಕೆ ಅನಿರೀಕ್ಷಿತ ಶುಲ್ಕ, OTP ಅಥವಾ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ."],
    ["ಅನುಮಾನಾಸ್ಪದ ಉದ್ಯೋಗ ಆಫರ್", "ಉದ್ಯೋಗದಾತರನ್ನು ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸಿ; ಮುಂಗಡ ಶುಲ್ಕ ಅಥವಾ ಸೂಕ್ಷ್ಮ ದಾಖಲೆ ಕೇಳಿದರೆ ಎಚ್ಚರ."],
    ["ವೇಷಧಾರಣೆ", "ನಂಬಿಕೆಯ ಸಂಖ್ಯೆಗೆ ನೀವೇ ಕರೆ ಮಾಡಿ ಅನಿರೀಕ್ಷಿತ ವಿನಂತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ."],
    ["ಪಾವತಿ ವಂಚನೆ", "UPI ವಿನಂತಿ ಒಪ್ಪುವ ಅಥವಾ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡುವ ಮೊದಲು ಸ್ವೀಕರಿಸುವವರನ್ನು ಮತ್ತು ಮೊತ್ತವನ್ನು ಪರಿಶೀಲಿಸಿ."],
  ],
} as const;

export default function SafetyScreen({ language }: SafetyScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const t = (key: TranslationKey) => translate(language, key);
  const safetyContent = content[language];
  const openPortal = async () => {
    try {
      await Linking.openURL("https://cybercrime.gov.in/");
    } catch {
      Alert.alert("Unable to open website", "Visit https://cybercrime.gov.in/ in your browser.");
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Feather name="shield" size={23} color={colors.blue} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{t("safetyTitle")}</Text>
          <Text style={styles.body}>{t("safetyIntro")}</Text>
        </View>
      </View>
      <View style={styles.sectionHeading}>
        <Feather name="check-circle" size={18} color={colors.blue} />
        <Text style={styles.section}>{t("tips")}</Text>
      </View>
      {safetyContent.map(([heading, detail], index) => (
        <View key={heading} style={styles.card}>
          <View style={styles.tipNumber}><Text style={styles.tipNumberText}>{String(index + 1).padStart(2, "0")}</Text></View>
          <View style={styles.tipCopy}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.body}>{detail}</Text>
          </View>
        </View>
      ))}
      <View style={styles.report}>
        <View style={styles.reportHeading}>
          <Feather name="flag" size={19} color={colors.blue} />
          <Text style={styles.heading}>{t("reportTitle")}</Text>
        </View>
        <Text style={styles.body}>{t("reportText")}</Text>
        <PrimaryButton label={t("officialPortal")} icon="external-link" variant="secondary" onPress={openPortal} />
      </View>
      <Text style={styles.disclaimer}>{t("aboutText")}</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, gap: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 13, padding: 17, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  heroCopy: { flex: 1, gap: 4 },
  title: { color: colors.navy, fontSize: 23, fontWeight: "900" },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7, marginBottom: 2 },
  section: { color: colors.navy, fontSize: 17, fontWeight: "800" },
  card: { flexDirection: "row", alignItems: "flex-start", padding: 15, borderRadius: 17, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 11 },
  tipNumber: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.paleBlue },
  tipNumberText: { color: colors.blue, fontSize: 11, fontWeight: "900" },
  tipCopy: { flex: 1, gap: 5 },
  heading: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  report: { padding: 18, borderRadius: 19, backgroundColor: colors.paleBlue, gap: 11, marginTop: 5 },
  reportHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  disclaimer: { color: colors.secondaryText, fontSize: 12, lineHeight: 19, marginBottom: 10 },
}); }