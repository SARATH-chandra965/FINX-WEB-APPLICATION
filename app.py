#!/usr/bin/env python3
"""FINX Web Application & API Server.

Zero external dependencies: runs on Python's standard library.
Serves the accessible single-page web UI and secure analysis API.

Architecture Steps Implemented:
1. User Input (SMS, WhatsApp, Call Transcript)
2. Preprocessing & Language Detection
3. Scam Detection Engine (4 Pillars)
4. Risk Assessment (0 - 100 Scoring)
5. Explainable Alert & Evidence Breakdown
6. Multilingual User Alerts (Telugu / English / Hindi) with Audio
7. Safety Guidance & 1930 Helpline
8. User Decision & Polite Refusal Assistance
9. Feedback & Improvement Loop

Usage:
    python app.py                 # Starts local server on http://127.0.0.1:8000
    python app.py --port 8080     # Custom port
    python app.py --cli "text"    # Direct command-line evaluation
"""

import sys
import os
import json
import argparse
import mimetypes
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# Guarantee UTF-8 console output on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.detector import ScamDetector
from core.ml_model import SpamClassifier

# Initialize ScamDetector (AI auto-activates if OPENAI_API_KEY or GEMINI_API_KEY is available)
detector = ScamDetector(use_ai=True)
ml_classifier = SpamClassifier.get_instance()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handles requests in a separate thread for instant responsiveness."""
    daemon_threads = True
    allow_reuse_address = False

class ScamShieldHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for ScamShield AI / FinX."""

    def log_message(self, format, *args):
        """Concise logging without dumping full user text."""
        sys.stderr.write(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}\n")

    def send_json(self, status_code: int, data: dict):
        """Sends a JSON response with security headers."""
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        """Handles CORS pre-flight requests."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Routes GET requests for HTML pages, static assets, and health check."""
        path = self.path.split("?")[0]

        # Page routing - serve HTML templates
        page_map = {
            "/": "login.html",
            "/index.html": "login.html",
            "/login": "login.html",
            "/login.html": "login.html",
            "/msg": "msg.html",
            "/analysis": "analysis.html",
            "/predict": "predict.html",
        }
        if path in page_map:
            template = page_map[path]
            template_file = os.path.join(os.path.dirname(__file__), "templates", template)
            if os.path.exists(template_file):
                with open(template_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("X-Content-Type-Options", "nosniff")
                self.end_headers()
                self.wfile.write(content)
                return
            else:
                self.send_error(404, f"Template {template} not found")
                return

        # 1c. Firebase Auth config endpoint
        if path == "/api/auth/config":
            self.send_json(200, {
                "apiKey": os.environ.get("FIREBASE_API_KEY", ""),
                "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", ""),
                "projectId": os.environ.get("FIREBASE_PROJECT_ID", ""),
                "appId": os.environ.get("FIREBASE_APP_ID", ""),
                "configured": bool(os.environ.get("FIREBASE_API_KEY"))
            })
            return

        # 2. Health check endpoint
        if path == "/api/health":
            self.send_json(200, {
                "status": "healthy",
                "app": "FINX",
                "version": "3.0.0",
                "architecture_steps": 9,
                "ai_provider": detector.llm_adapter.get_provider_info(),
                "ml_model": ml_classifier.get_info(),
                "offline_mode": not detector.llm_adapter.is_available()
            })
            return

        # 2b. ML Model Info endpoint
        if path == "/api/model-info":
            self.send_json(200, {
                "ml_model": ml_classifier.get_info(),
                "ai_provider": detector.llm_adapter.get_provider_info(),
                "detection_pillars": [
                    "1. Keyword & Pattern Matching (regex rules)",
                    "2. Impersonation Detection (entity recognition)",
                    "3. Suspicious Link Analysis (phishing URL detection)",
                    "4. ML Spam Classifier (TF-IDF + Naive Bayes trained on internet spam data)",
                    "5. AI Analysis (OpenAI ChatGPT / Google Gemini)"
                ]
            })
            return

        # 3. Static asset serving with directory traversal protection
        if path.startswith("/static/"):
            relative_path = path[len("/static/"):]
            safe_path = os.path.normpath(relative_path).lstrip(r"\/")
            file_path = os.path.join(os.path.dirname(__file__), "static", safe_path)

            if os.path.isfile(file_path):
                mime_type, _ = mimetypes.guess_type(file_path)
                mime_type = mime_type or "application/octet-stream"
                if mime_type.startswith("text/") or mime_type == "application/javascript":
                    mime_type += "; charset=utf-8"

                with open(file_path, "rb") as f:
                    content = f.read()

                self.send_response(200)
                self.send_header("Content-Type", mime_type)
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Cache-Control", "public, max-age=3600")
                self.end_headers()
                self.wfile.write(content)
                return
            else:
                self.send_error(404, "Static file not found")
                return

        self.send_error(404, "Not Found")

    def do_POST(self):
        """Handles POST /api/analyze and POST /api/feedback requests."""
        path = self.path.split("?")[0]

        # POST /api/analyze - Main scam detection endpoint
        if path == "/api/analyze":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                if content_len > 15000:
                    self.send_json(413, {"error": "Payload too large. Please paste a shorter message."})
                    return

                body = self.rfile.read(content_len).decode("utf-8")
                data = json.loads(body) if body else {}

                raw_text = data.get("text", "")
                language = data.get("language", "en")
                user_context = data.get("user_context", {})

                result = detector.analyze(raw_text, language=language, user_context=user_context)
                self.send_json(200, result)

            except json.JSONDecodeError:
                self.send_json(400, {
                    "status": "error",
                    "concern_level": "Needs verification",
                    "error": "Invalid JSON in request body."
                })
            except Exception as e:
                self.send_json(500, {
                    "status": "error",
                    "concern_level": "Needs verification",
                    "error": f"Internal server error: {str(e)}"
                })
            return

        # POST /api/feedback - Step 9: Feedback & Improvement loop (persisted to file)
        if path == "/api/feedback":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                fb_data = json.loads(body) if body else {}

                # Persist feedback to JSONL file for ML retraining
                feedback_file = os.path.join(os.path.dirname(__file__), "data", "user_feedback.jsonl")
                os.makedirs(os.path.dirname(feedback_file), exist_ok=True)
                with open(feedback_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(fb_data, ensure_ascii=False) + "\n")

                self.send_json(200, {
                    "status": "received",
                    "message": "Thank you! Your feedback helps protect families and improve FINX.",
                    "recorded": True
                })
            except Exception as e:
                self.send_json(400, {"error": "Could not record feedback"})
            return

        # POST /api/configure-ai - Set API key at runtime
        if path == "/api/configure-ai":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                cfg = json.loads(body) if body else {}

                provider = cfg.get("provider", "").lower()
                api_key = cfg.get("api_key", "").strip()
                model = cfg.get("model", "").strip()

                if not api_key:
                    self.send_json(400, {"error": "api_key is required."})
                    return

                if provider == "openai" or provider == "chatgpt":
                    detector.llm_adapter.set_openai_key(api_key, model or None)
                    detector.use_ai = True
                elif provider == "gemini":
                    detector.llm_adapter.set_gemini_key(api_key)
                    detector.use_ai = True
                else:
                    # Auto-detect: if key starts with sk-, it's OpenAI
                    if api_key.startswith("sk-"):
                        detector.llm_adapter.set_openai_key(api_key, model or None)
                    else:
                        detector.llm_adapter.set_gemini_key(api_key)
                    detector.use_ai = True

                self.send_json(200, {
                    "status": "configured",
                    "ai_provider": detector.llm_adapter.get_provider_info()
                })
            except Exception as e:
                self.send_json(500, {"error": f"Configuration failed: {str(e)}"})
            return

        # POST /api/retrain - Retrain ML model with latest feedback data
        if path == "/api/retrain":
            try:
                result = ml_classifier.train()
                self.send_json(200, {
                    "status": "retrained",
                    "model": result
                })
            except Exception as e:
                self.send_json(500, {"error": f"Retraining failed: {str(e)}"})
            return

        # POST /api/ml-predict - ML-only spam prediction (bypass rule engine)
        if path == "/api/ml-predict":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                data = json.loads(body) if body else {}
                text = data.get("text", "")
                result = ml_classifier.predict(text)
                self.send_json(200, result)
            except Exception as e:
                self.send_json(500, {"error": f"ML prediction failed: {str(e)}"})
            return

        self.send_error(404, "Not Found")

def run_cli_test(text: str, lang: str = "en"):
    """Runs a quick analysis directly in the terminal."""
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    res = detector.analyze(text, language=lang)
    print("\n" + "="*60)
    print(f"[*] FINX DIAGNOSTIC REPORT")
    print(f"[*] RISK SCORE: {res['risk_score']}/100 [{res['risk_category']}]")
    print(f"[*] CONCERN LEVEL: {res['concern_level']} ({res['primary_threat']})")
    print(f"[*] SUMMARY: {res['summary']}")
    print(f"[*] LATENCY: {res['latency_ms']} ms")
    if res.get('reasons'):
        print("\n[*] WHY WE FLAGGED THIS:")
        for r in res['reasons']:
            print(f"  - {r}")
    if res['evidence']:
        print("\n[*] FORENSIC EVIDENCE DETECTED:")
        for ev in res['evidence']:
            print(f"  * \"{ev['quote']}\" [{ev['category']}]")
    print("\n[*] SAFE NEXT ACTIONS:")
    for a in res['safe_next_actions']:
        print(f"  [+] {a}")
    print("="*60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="FINX Scam Protection Server")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)), help="Port to listen on (default 8000)")
    parser.add_argument("--host", type=str, default=os.environ.get("HOST", "127.0.0.1"), help="Host to bind to (default 127.0.0.1)")
    parser.add_argument("--cli", type=str, help="Analyze message directly via CLI and exit")
    parser.add_argument("--lang", type=str, default="en", help="Language for CLI mode (en, te, or hi)")
    args = parser.parse_args()

    if args.cli:
        run_cli_test(args.cli, lang=args.lang)
        return

    server_address = (args.host, args.port)
    httpd = ThreadedHTTPServer(server_address, ScamShieldHandler)

    local_ip = "127.0.0.1"
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    url = f"http://localhost:{args.port}"
    ai_info = detector.llm_adapter.get_provider_info()
    ml_info = ml_classifier.get_info()
    print(f"\n=======================================================")
    print(f"[*] FINX Server Running (v3.0.0)")
    print(f"[*] Architecture: 9-Step End-to-End Pipeline Active")
    print(f"[*] Computer Browser: {url}")
    print(f"[*] Mobile Phone (same Wi-Fi): http://{local_ip}:{args.port}")
    print(f"[*] ML Engine: {ml_info.get('model_type', 'N/A')} ({ml_info.get('samples_count', 0)} samples)")
    print(f"[*] AI Provider: {ai_info.get('provider', 'None')} [{ai_info.get('key_status', 'Not configured')}]")
    print(f"[*] Press Ctrl+C to stop the server")
    print(f"=======================================================\n")

    if not os.environ.get("NO_BROWSER"):
        def open_browser():
            import time
            import webbrowser
            time.sleep(0.6)
            try:
                webbrowser.open(url)
            except Exception:
                pass
        threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped gracefully.")
        httpd.server_close()

if __name__ == "__main__":
    main()
