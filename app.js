/**
 * FINX Mobile Application Logic
 * Implements mobile-format UI/UX matching specifications:
 * 1. Card 1 (Check a message): Channel tabs, sample loader, privacy note, voice input
 * 2. Card 2 (Understand the risk): 3-segment horizontal risk meter, suspicious phrases with (!),
 *    audio listen, classification buttons, and "Help Me Say No" drawer.
 */

// Application State
let currentLanguage = 'te'; // Telugu default
let currentChannel = 'sms';
let speechRecognition = null;
let isListening = false;
let currentSpeechUtterance = null;
let lastAnalysisData = null;
let isPlayingAudio = false;

// ==============================================================================
// Heavenly Dynamic Theme Engine (Light / Dark Mode with Persistence)
// ==============================================================================
function initTheme() {
    const saved = localStorage.getItem('finx_theme') || 'light';
    setTheme(saved, false);
}

function setTheme(theme, playSound = true) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('finx_theme', theme); } catch(e) {}
    const toggles = document.querySelectorAll('.btn-theme-toggle');
    toggles.forEach(btn => {
        btn.innerHTML = theme === 'dark' ? '☀️ <span class="theme-txt">Light</span>' : '🌙 <span class="theme-txt">Dark</span>';
        btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    });
    if (playSound) playCyberSound('click');
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
}

// Auto initialize theme immediately
if (typeof document !== 'undefined') {
    initTheme();
    document.addEventListener('DOMContentLoaded', initTheme);
}

// ==============================================================================
// Web Audio Truecaller & Heavenly Chime Synthesizer (Zero external dependencies)
// ==============================================================================
let audioCtx = null;
let sfxEnabled = true;

function getAudioContext() {
    try {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioCtxClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    } catch (e) {
        return null;
    }
}

function playCyberSound(type) {
    if (!sfxEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1040, now);
            osc.frequency.exponentialRampToValueAtTime(1560, now + 0.04);
            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'scan') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
            osc.start(now);
            osc.stop(now + 0.20);
        } else if (type === 'alert') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(784, now);
            osc.frequency.setValueAtTime(587, now + 0.08);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.06);
            osc.frequency.setValueAtTime(784, now + 0.12);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) {}
}

function toggleSFX() {
    sfxEnabled = !sfxEnabled;
    const btn = document.getElementById('btn-sfx-toggle');
    if (btn) {
        btn.textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
        btn.classList.toggle('sfx-muted', !sfxEnabled);
    }
    if (sfxEnabled) playCyberSound('click');
}

// Locales for Web Speech API
const LANG_LOCALES = {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    gu: 'gu-IN',
    ml: 'ml-IN',
    pa: 'pa-IN'
};

// Realistic Default Samples across Channels
const CHANNEL_SAMPLES = {
    sms: "Dear customer, your bank account will be blocked in 24 hours. Update KYC now at bank-verify.example and share your OTP to keep your account active.",
    whatsapp: "Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw. Click this link to claim reward: bit.ly/kbc-prize-claim and pay refundable Rs 2500 processing charge.",
    call: "Caller claimed to be Inspector Sharma from CBI Crime Branch. Said a parcel in my name was seized at Mumbai airport and threatened Digital Arrest unless I join a Skype call."
};

// Set Active Channel (SMS / WhatsApp / Call transcript)
function setChannel(channel) {
    playCyberSound('click');
    currentChannel = channel;
    document.querySelectorAll('.segment-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${channel}`);
    if (activeTab) activeTab.classList.add('active');

    const sampleBtn = document.getElementById('btn-load-sample');
    if (sampleBtn) {
        sampleBtn.textContent = `SAMPLE ${channel === 'call' ? 'CALL' : channel.toUpperCase()}`;
    }

    const input = document.getElementById('message-input');
    if (input) {
        input.value = CHANNEL_SAMPLES[channel] || "";
    }
}

// Load Active Channel Sample
function loadActiveChannelSample() {
    playCyberSound('click');
    const input = document.getElementById('message-input');
    if (input) {
        input.value = CHANNEL_SAMPLES[currentChannel] || "";
        input.focus();
    }
}

// Clear Message
function clearInput() {
    playCyberSound('click');
    stopSpeaking();
    const input = document.getElementById('message-input');
    if (input) {
        input.value = "";
        input.focus();
    }
    showStep(1);
}

function showStep(stepNumber) {
    const cards = [1, 2, 3].map(n => document.getElementById(`card-step-${n}`)).filter(Boolean);
    cards.forEach(card => {
        card.style.display = 'none';
    });

    const target = document.getElementById(`card-step-${stepNumber}`);
    if (target) {
        target.style.display = 'block';
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
    initSpeechRecognition();
    const selectElem = document.getElementById('lang-select');
    if (selectElem) {
        currentLanguage = selectElem.value;
    }
    loadModelInfo();
    if (typeof getCurrentUser === 'function') {
        updateAuthUI(getCurrentUser());
    }
});

// Sync Auth UI in Top Bar
function updateAuthUI(user) {
    const authBtn = document.getElementById('btn-top-auth');
    const avatar = document.getElementById('top-user-avatar');
    const name = document.getElementById('top-user-name');
    if (!authBtn || !avatar || !name) return;

    if (user) {
        authBtn.href = "#";
        authBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm(`Signed in as ${user.email || user.displayName}.\n\nDo you want to sign out?`)) {
                if (typeof signOutUser === 'function') {
                    signOutUser().then(() => {
                        updateAuthUI(null);
                    });
                }
            }
        };

        if (user.photoURL) {
            avatar.innerHTML = `<img src="${escapeHtml(user.photoURL)}" alt="Avatar" referrerpolicy="no-referrer">`;
        } else {
            const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
            avatar.textContent = initial;
        }

        const displayName = user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User');
        name.textContent = displayName;
        authBtn.title = `Signed in as ${user.email} (Click to sign out)`;
    } else {
        authBtn.href = "/login";
        authBtn.onclick = null;
        avatar.textContent = "👤";
        name.textContent = "Sign In";
        authBtn.title = "Sign In to FINX";
    }
}

window.addEventListener('finx:auth-change', (e) => {
    updateAuthUI(e.detail ? e.detail.user : null);
});

// Setup Web Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;

        speechRecognition.onstart = () => {
            isListening = true;
            document.getElementById('voice-indicator').style.display = 'flex';
            const btn = document.getElementById('btn-voice');
            btn.classList.add('recording');
        };

        speechRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            document.getElementById('message-input').value = transcript;
        };

        speechRecognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            stopVoiceInput();
        };

        speechRecognition.onend = () => {
            stopVoiceInput();
        };
    }
}

function toggleVoiceInput() {
    if (!speechRecognition) {
        alert("Voice recognition is not supported in this browser. Please type or paste your message.");
        return;
    }

    if (isListening) {
        speechRecognition.stop();
        stopVoiceInput();
    } else {
        speechRecognition.lang = LANG_LOCALES[currentLanguage] || 'te-IN';
        try {
            speechRecognition.start();
        } catch (e) {
            console.error("Could not start voice recognition:", e);
        }
    }
}

function stopVoiceInput() {
    isListening = false;
    document.getElementById('voice-indicator').style.display = 'none';
    const btn = document.getElementById('btn-voice');
    btn.classList.remove('recording');
}

// Audio Read-Aloud Toggle
function toggleAudioListen() {
    if (isPlayingAudio) {
        stopSpeaking();
    } else {
        startSpeaking();
    }
}

function startSpeaking() {
    if (!('speechSynthesis' in window)) {
        alert("Audio playback is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    // Prepare text to speak
    let textToSpeak = "";
    if (lastAnalysisData) {
        if (currentLanguage === 'te' && lastAnalysisData.user_alert && lastAnalysisData.user_alert.te) {
            textToSpeak = lastAnalysisData.user_alert.te;
        } else if (currentLanguage === 'hi' && lastAnalysisData.user_alert && lastAnalysisData.user_alert.hi) {
            textToSpeak = lastAnalysisData.user_alert.hi;
        } else {
            textToSpeak = (lastAnalysisData.user_alert && lastAnalysisData.user_alert.en) || "Warning. High risk: likely scam. Do not reply or share any details.";
        }
    } else {
        textToSpeak = "High risk: likely scam. Do not reply, open the link or share any details.";
    }

    const targetLocale = LANG_LOCALES[currentLanguage] || 'te-IN';
    currentSpeechUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentSpeechUtterance.lang = targetLocale;
    currentSpeechUtterance.rate = 0.88; // Calm pace for seniors

    const listenLabel = document.getElementById('txt-listen-label');

    currentSpeechUtterance.onstart = () => {
        isPlayingAudio = true;
        if (listenLabel) listenLabel.textContent = "Stop";
    };

    currentSpeechUtterance.onend = () => {
        isPlayingAudio = false;
        if (listenLabel) listenLabel.textContent = "Listen";
    };

    currentSpeechUtterance.onerror = () => {
        isPlayingAudio = false;
        if (listenLabel) listenLabel.textContent = "Listen";
    };

    window.speechSynthesis.speak(currentSpeechUtterance);
}

function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    isPlayingAudio = false;
    const listenLabel = document.getElementById('txt-listen-label');
    if (listenLabel) listenLabel.textContent = "Listen";
}

// Language Switcher
function setLanguage(lang) {
    currentLanguage = lang;
    const selectElem = document.getElementById('lang-select');
    if (selectElem && selectElem.value !== lang) {
        selectElem.value = lang;
    }

    // Update mic button label
    const micLabel = document.getElementById('txt-mic-label');
    if (micLabel) {
        micLabel.textContent = lang === 'te' ? "Speak (తెలుగు / Eng)" : (lang === 'hi' ? "बोलें (हिन्दी / Eng)" : "Speak Voice");
    }

    // If result is showing, re-render regional card
    if (lastAnalysisData && document.getElementById('card-step-2').style.display !== 'none') {
        renderRegionalAdvisory(lastAnalysisData);
    }
}

// Main Analysis Call
async function analyzeMessage(userContext = null) {
    stopSpeaking();
    playCyberSound('scan');
    const text = document.getElementById('message-input').value.trim();
    if (!text) {
        alert("Please enter or paste a message to analyze.");
        return;
    }

    const loadingElem = document.getElementById('loading-spinner');
    const card2 = document.getElementById('card-step-2');
    const card3 = document.getElementById('card-step-3');

    loadingElem.style.display = 'block';
    if (!userContext) {
        if (card2) card2.style.display = 'none';
        if (card3) card3.style.display = 'none';
    }

    try {
        const payload = {
            text: text,
            language: currentLanguage
        };
        if (userContext) {
            payload.user_context = userContext;
        }

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server status ${response.status}`);
        }

        const data = await response.json();
        lastAnalysisData = data;
        renderResult(data);

    } catch (error) {
        console.error("Analysis error:", error);
        alert(`Analysis could not be completed: ${error.message}`);
    } finally {
        loadingElem.style.display = 'none';
    }
}

// Renders the Analysis Result matching Image 2
function renderResult(data) {
    const card2 = document.getElementById('card-step-2');
    const riskBox = document.getElementById('risk-status-box');
    const statusTitle = document.getElementById('status-title');
    const statusAdvisory = document.getElementById('status-advisory');
    const scoreNum = document.getElementById('risk-score-num');
    const meterPin = document.getElementById('meter-pin');
    const latencyText = document.getElementById('latency-text');
    const suspiciousList = document.getElementById('suspicious-list-container');
    const reasonsContainer = document.getElementById('reasons-container');
    const reasonsList = document.getElementById('reasons-list');

    const score = data.risk_score || 0;
    if (scoreNum) scoreNum.textContent = score;
    if (latencyText) latencyText.textContent = `${data.latency_ms} ms (${data.engine_note || 'Local Engine'})`;

    // Dynamic Pin Position on 3-Segment Bar (Bounded between 2% and 98%)
    const pinPos = Math.max(2, Math.min(98, score));
    if (meterPin) {
        meterPin.style.left = `${pinPos}%`;
    }

    // Persist to local storage for Analysis dashboard
    try {
        const stats = JSON.parse(localStorage.getItem('finx_scan_stats') || '{"totalScans":0,"threatsFound":0,"safeMsgs":0,"sumRisk":0,"avgRisk":0}');
        stats.totalScans = (stats.totalScans || 0) + 1;
        if (score > 30) {
            stats.threatsFound = (stats.threatsFound || 0) + 1;
        } else {
            stats.safeMsgs = (stats.safeMsgs || 0) + 1;
        }
        stats.sumRisk = (stats.sumRisk || 0) + score;
        stats.avgRisk = Math.round(stats.sumRisk / stats.totalScans);
        localStorage.setItem('finx_scan_stats', JSON.stringify(stats));

        const history = JSON.parse(localStorage.getItem('finx_scan_history') || '[]');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        history.unshift({
            score: score,
            level: score > 70 ? 'high' : (score > 30 ? 'medium' : 'low'),
            text: data.input_text || (document.getElementById('message-input') ? document.getElementById('message-input').value.trim() : ''),
            time: timeStr
        });
        localStorage.setItem('finx_scan_history', JSON.stringify(history.slice(0, 20)));
    } catch(e) {}

    // Configure Risk Level Classes & Copy
    riskBox.className = "risk-status-box";
    card2.className = "mobile-card result-card";

    if (score > 70) {
        playCyberSound('alert');
        statusTitle.textContent = "High risk: likely scam";
        statusAdvisory.textContent = "Do not reply, open the link or share any details.";
        card2.classList.remove('med-border', 'low-border');
    } else if (score >= 31) {
        playCyberSound('click');
        riskBox.classList.add('med-risk');
        card2.classList.add('med-border');
        statusTitle.textContent = "Medium risk: needs verification";
        statusAdvisory.textContent = "Verify independently through official bank channels before acting.";
    } else {
        playCyberSound('success');
        riskBox.classList.add('low-risk');
        card2.classList.add('low-border');
        statusTitle.textContent = "Low risk: likely legitimate";
        statusAdvisory.textContent = "No obvious warning signs detected. Always stay vigilant.";
    }

    // Render ML Spam Classifier and AI verification badges
    const mlPred = data.ml_spam_prediction || (data.engine_breakdown && data.engine_breakdown.ml_spam_classifier);
    const mlTxt = document.getElementById('txt-ml-assessment');
    if (mlPred && mlTxt) {
        const prob = mlPred.spam_percentage !== undefined ? mlPred.spam_percentage : (mlPred.spam_probability ? (mlPred.spam_probability * 100).toFixed(1) : 0);
        mlTxt.innerHTML = `ML Spam Classifier: <strong>${prob}%</strong> probability`;
    }

    const aiBadge = document.getElementById('badge-ai-provider');
    const aiTxt = document.getElementById('txt-ai-assessment');
    if (data.analysis_mode === 'ai_assisted' || data.engine_used === 'ai_enhanced') {
        if (aiBadge) aiBadge.style.display = 'inline-flex';
        if (aiTxt) aiTxt.textContent = `${data.ai_provider?.provider || 'ChatGPT'} Verified`;
    } else {
        if (aiBadge) aiBadge.style.display = 'none';
    }

    // Render Regional Advisory Card
    renderRegionalAdvisory(data);

    // Render "What looks suspicious?" List with exact Image 2 styling
    suspiciousList.innerHTML = '';
    if (data.evidence && data.evidence.length > 0) {
        data.evidence.forEach(ev => {
            const item = document.createElement('div');
            item.className = 'suspicious-item';
            
            // Choose explanation based on current language
            let expl = ev.explanation_en;
            if (currentLanguage === 'te' && ev.explanation_te) {
                expl = ev.explanation_te;
            } else if (currentLanguage === 'hi' && ev.explanation_hi) {
                expl = ev.explanation_hi;
            }

            item.innerHTML = `
                <div class="suspicious-excl-icon">!</div>
                <div class="suspicious-content">
                    <span class="suspicious-quote">&ldquo;${escapeHtml(ev.quote)}&rdquo;</span>
                    <p class="suspicious-desc">${escapeHtml(expl || ev.category)}</p>
                </div>
            `;
            suspiciousList.appendChild(item);
        });
    } else {
        suspiciousList.innerHTML = `
            <div class="suspicious-item">
                <div class="suspicious-excl-icon" style="background:#dcfce7; color:#166534;">✓</div>
                <div class="suspicious-content">
                    <span class="suspicious-quote" style="color:#166534;">No obvious suspicious phrases</span>
                    <p class="suspicious-desc">This message does not contain known urgent threats or credential demands.</p>
                </div>
            </div>
        `;
    }

    // Render Reasons
    if (data.reasons && data.reasons.length > 0 && reasonsContainer && reasonsList) {
        reasonsList.innerHTML = '';
        data.reasons.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            reasonsList.appendChild(li);
        });
        reasonsContainer.style.display = 'block';
    } else if (reasonsContainer) {
        reasonsContainer.style.display = 'none';
    }

    // Render 'Help Me Say No' Script
    const refusalQuote = document.getElementById('refusal-quote');
    if (refusalQuote && data.help_me_say_no_script) {
        let script = data.help_me_say_no_script.en;
        if (currentLanguage === 'te' && data.help_me_say_no_script.te) {
            script = data.help_me_say_no_script.te;
        } else if (currentLanguage === 'hi' && data.help_me_say_no_script.hi) {
            script = data.help_me_say_no_script.hi;
        }
        refusalQuote.textContent = script;
    }

    // Render Safe Next Steps
    const safeStepsList = document.getElementById('safe-steps-list');
    if (safeStepsList && data.safe_next_actions) {
        safeStepsList.innerHTML = '';
        data.safe_next_actions.slice(0, 4).forEach(act => {
            const li = document.createElement('li');
            li.textContent = act;
            safeStepsList.appendChild(li);
        });
    }

    // Reset classification buttons
    document.querySelectorAll('.btn-fb-choice').forEach(b => b.classList.remove('selected'));
    const fbMsg = document.getElementById('fb-feedback-msg');
    if (fbMsg) fbMsg.textContent = "Helps improve detection accuracy.";

    showStep(2);
}

// Renders the Regional Language Advisory
function renderRegionalAdvisory(data) {
    const langTag = document.getElementById('regional-lang-tag');
    const advisoryText = document.getElementById('regional-advisory-text');

    if (currentLanguage === 'te') {
        langTag.textContent = "తెలుగు సలహా (Telugu Advisory)";
        advisoryText.textContent = (data.user_alert && data.user_alert.te) || data.summary_te || "ఈ సందేశం మోసపూరితంగా ఉండే అవకాశం ఉంది. మీ వివరాలను ఎవరితోనూ పంచుకోవద్దు.";
    } else if (currentLanguage === 'hi') {
        langTag.textContent = "हिन्दी सलाह (Hindi Advisory)";
        advisoryText.textContent = (data.user_alert && data.user_alert.hi) || data.summary_hi || "इस संदेश में धोखाधड़ी की आशंका है। किसी अनजान लिंक या व्यक्ति से जानकारी साझा न करें।";
    } else {
        langTag.textContent = "English Advisory";
        advisoryText.textContent = (data.user_alert && data.user_alert.en) || data.summary_en || "This message is likely a scam. Do not share your OTP or click on any links.";
    }
}

// Feedback Classification (Scam / Legitimate)
async function submitFeedback(choice) {
    document.querySelectorAll('.btn-fb-choice').forEach(b => b.classList.remove('selected'));
    const clickedBtn = document.getElementById(choice === 'scam' ? 'btn-fb-scam' : 'btn-fb-legit');
    if (clickedBtn) clickedBtn.classList.add('selected');

    const fbMsg = document.getElementById('fb-feedback-msg');
    if (fbMsg) {
        fbMsg.textContent = choice === 'scam' ? "✓ Marked as Scam. Thank you for your feedback!" : "✓ Marked as Legitimate. Thank you for your feedback!";
        fbMsg.style.color = "#166534";
    }

    try {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                classification: choice,
                risk_score: lastAnalysisData ? lastAnalysisData.risk_score : null,
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) {
        // Safe local record
    }
}

// Toggle Extra Tools (Help Me Say No & Safe Steps)
function toggleExtraTools() {
    const content = document.getElementById('extra-tools-content');
    const chevron = document.getElementById('extra-tools-chevron');
    if (!content) return;

    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        if (chevron) chevron.textContent = '▲';
    } else {
        content.style.display = 'none';
        if (chevron) chevron.textContent = '▼';
    }
}

// Copy Refusal Script
function copyRefusalScript() {
    const textElem = document.getElementById('refusal-quote');
    if (!textElem) return;
    const text = textElem.textContent.trim();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-refusal');
        const orig = btn.textContent;
        btn.textContent = "✓ Copied!";
        setTimeout(() => { btn.textContent = orig; }, 2000);
    }).catch(() => {
        alert("Please copy manually: " + text);
    });
}

// Scroll Back to Input Card
function scrollToInput() {
    showStep(1);
    const input = document.getElementById('message-input');
    if (input) input.focus();
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Toggle AI & ML Settings Modal
function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    const isShowing = modal.style.display !== 'none';
    modal.style.display = isShowing ? 'none' : 'flex';
    if (!isShowing) {
        loadModelInfo();
    }
}

// Load ML Model & AI Provider Info from Backend
async function loadModelInfo() {
    try {
        const resp = await fetch('/api/model-info');
        if (!resp.ok) return;
        const data = await resp.json();

        // Update ML model stats
        const ml = data.ml_model || {};
        const statSamples = document.getElementById('stat-samples');
        const statAccuracy = document.getElementById('stat-accuracy');
        const statEngine = document.getElementById('stat-engine');

        if (statSamples && ml.samples_count) statSamples.textContent = ml.samples_count;
        if (statAccuracy && ml.accuracy) statAccuracy.textContent = `${(ml.accuracy * 100).toFixed(0)}%`;
        if (statEngine) statEngine.textContent = ml.model_type?.includes('scikit') ? 'TF-IDF + NB' : 'Naive Bayes';

        // Update AI status badge
        const ai = data.ai_provider || {};
        const aiBadge = document.getElementById('ai-status-badge');
        if (aiBadge) {
            if (ai.enabled) {
                aiBadge.textContent = `🟢 Active: ${ai.provider} (${ai.model}) - ${ai.key_status}`;
                aiBadge.style.color = '#166534';
            } else {
                aiBadge.textContent = `⚪ Offline Local Mode (Trained ML + Security Rules Active)`;
                aiBadge.style.color = '#64748b';
            }
        }
    } catch (e) {
        console.warn('Could not fetch model info:', e);
    }
}

// Save OpenAI or Gemini API Key
async function saveAIKey() {
    const provider = document.getElementById('ai-provider-select').value;
    const apiKey = document.getElementById('ai-api-key-input').value.trim();
    const statusElem = document.getElementById('ai-status-badge');

    if (!apiKey) {
        alert('Please enter a valid API key.');
        return;
    }

    if (statusElem) {
        statusElem.textContent = 'Saving & verifying key...';
        statusElem.style.color = '#3b82f6';
    }

    try {
        const resp = await fetch('/api/configure-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: provider,
                api_key: apiKey
            })
        });

        const data = await resp.json();
        if (resp.ok && data.status === 'configured') {
            const ai = data.ai_provider || {};
            if (statusElem) {
                statusElem.textContent = `✓ Successfully configured ${ai.provider}!`;
                statusElem.style.color = '#166534';
            }
            document.getElementById('ai-api-key-input').value = '';
            setTimeout(() => {
                loadModelInfo();
            }, 1200);
        } else {
            throw new Error(data.error || 'Failed to configure AI key.');
        }
    } catch (err) {
        alert(`Error: ${err.message}`);
        if (statusElem) {
            statusElem.textContent = `Error: ${err.message}`;
            statusElem.style.color = '#dc2626';
        }
    }
}

// Retrain Model with Feedback Data
async function retrainModel() {
    const btn = document.getElementById('btn-retrain');
    const status = document.getElementById('retrain-status');
    if (btn) btn.disabled = true;
    if (status) {
        status.textContent = 'Retraining classifier on internet spam datasets & feedback...';
        status.style.color = '#3b82f6';
    }

    try {
        const resp = await fetch('/api/retrain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await resp.json();
        if (resp.ok && data.status === 'retrained') {
            const m = data.model || {};
            if (status) {
                status.textContent = `✓ Model retrained! ${m.samples_count} samples, ${(m.accuracy * 100).toFixed(1)}% cross-validation accuracy.`;
                status.style.color = '#166534';
            }
            loadModelInfo();
        } else {
            throw new Error(data.error || 'Retraining failed');
        }
    } catch (err) {
        if (status) {
            status.textContent = `Retrain error: ${err.message}`;
            status.style.color = '#dc2626';
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}
