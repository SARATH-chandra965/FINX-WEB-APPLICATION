# FINX — AI Scam Protection & Explainable Verification

> **Built for Senior Citizens and Rural Digital Inclusion**  
> Verifiable, on-device AI scam detection with explainable forensic evidence and bilingual audio synthesis.

---

## 🏛️ 9-Step End-to-End Architecture

```
[1. User Input] ➔ [2. Preprocessing] ➔ [3. Detection Engine] ➔ [4. Risk Assessment]
    (SMS/WA/Call)    (Clean/Tokens/Lang)   (4 Security Pillars)   (0 - 100 Gauge Meter)
                            │
                            ▼
[8. User Decision] ◄── [7. Safety Guidance] ◄── [6. Multilingual Alert] ◄── [5. Explainable Alert]
 ("Say No" / Context)     (Golden Rules / 1930)   (Telugu/English Audio)     (Phrases & Reasons)
        │
        ▼
[9. Feedback & Improvement Loop]
 (Continuous accuracy refinement)
```

---

## ⚡ Quick Start (Zero Dependencies)

Runs directly on Python's built-in standard library. No `pip install` or heavy build tools required!

### 1. Launch the Application
```bash
python app.py
```
* Or double-click **`start.bat`**
* Opens automatically at `http://127.0.0.1:8000`

### 2. Test via CLI
```bash
python app.py --cli "Dear Consumer, your electricity power will be cutoff tonight at 9:30 PM. Pay Rs 200 or install bill.apk"
```

### 3. Run Automated Tests
```bash
python -m unittest discover tests
```
* **29/29 tests pass** in ~1.1s.

---

## 🛡️ The 9 Solution Steps Explained

1. **User Authentication & Input**:
   - **Firebase Authentication**: Sign In & Sign Up with **Email/Password** and **Google One-Click Sign-In** via Firebase Auth SDK.
   - **Guest Access**: Seamless unauthenticated message checking so elderly users are never blocked by login barriers.
   - **Multi-channel support**: **SMS**, **WhatsApp Message**, and **Call Transcript**.
   - Voice input in Telugu, Hindi, English, and regional Indian languages using the Web Speech API.
   - Quick one-click realistic sample loaders.

2. **Preprocessing**:
   - Removes noise and extracts links.
   - Automated language identification (Telugu `U+0C00-U+0C7F`, Hindi `U+0900-U+097F`, English).
   - Word tokenization and character counting with sub-millisecond latency.

3. **Scam Detection Engine (5 Pillars)**:
   - **Keyword & Pattern Matching**: Detects OTP theft, urgency pressure, and fee transfer traps.
   - **Impersonation Detection**: Identifies fake bank, utility board, police, CBI, and customs claims.
   - **Suspicious Link Analysis**: Flags phishing paths (`/verify`, `/payment`, `/kyc`) and obfuscated shortlinks (`bit.ly`).
   - **Machine Learning Spam Classifier**: TF-IDF + Multinomial Naive Bayes trained on internet SMS spam benchmarks and real-world Indian cybercrime messages with cross-validation.
   - **Cloud AI (ChatGPT / Gemini)**: Optional OpenAI (`OPENAI_API_KEY` / `gpt-4o-mini`) or Google Gemini integration for deep linguistic reasoning, prompt-injection sandboxed.

4. **Risk Assessment (0 - 100 Speedometer & 3-Band Meter)**:
   - Dynamic SVG semi-circle speedometer with animated needle.
   - **Low Risk (0 - 30)**: Green zone.
   - **Medium Risk (31 - 70)**: Amber warning zone.
   - **High Risk (71 - 100)**: Red critical danger zone.

5. **Explainable Alert**:
   - Color-coded text highlighting for exact suspicious phrases.
   - Verbatim forensic quote table showing severity and category.
   - Plain-language *"Why We Flagged This"* threat breakdown.

6. **Multilingual User Alert**:
   - Dual side-by-side alert cards in **English** and **Telugu** (తెలుగు).
   - One-click **🔊 Listen Aloud** buttons with calm pacing designed for seniors.

7. **Safety Guidance**:
   - 4 Golden Rules: Never share OTP, Avoid suspicious links, Verify official channels, Call 1930 Helpline.
   - Direct-dial button for India's **National Cybercrime Helpline (1930)**.

8. **User Decision Support**:
   - **"Help Me Say No"**: Polite, firm pre-written refusal responses in Telugu, Hindi, and English with one-click copy and audio playback.
   - Up to 3 simple follow-up context questions to confirm sender identity.
   - Honest limitation declarations on what cannot be verified from text alone.

9. **Feedback & Continuous Improvement**:
   - User feedback collection (Accurate Scam / Safe / False Alarm).
   - Local on-device storage loop to continually refine community protection patterns.

---

## 🔒 Security & Privacy Commitments
- **Zero Data Leakage**: User messages are analyzed on-device without cloud transmission by default.
- **Fail-Safe Fallback**: Any external network or timeout cleanly falls back to deterministic local rules.
- **Anti-Prompt-Injection**: Sandboxed user inputs prevent malicious prompt overrides.
