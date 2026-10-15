"""Tests for API Server Endpoints and Security."""

import unittest
import urllib.request
import urllib.error
import json
import threading
import time
from app import ThreadedHTTPServer, ScamShieldHandler

class TestAPIIntegration(unittest.TestCase):
    """Verifies HTTP server endpoints and input validation."""

    @classmethod
    def setUpClass(cls):
        cls.server = ThreadedHTTPServer(("127.0.0.1", 0), ScamShieldHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_health_check(self):
        url = f"http://127.0.0.1:{self.port}/api/health"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["app"], "FINX")

    def test_serve_html_index(self):
        url = f"http://127.0.0.1:{self.port}/"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers["Content-Type"])

    def test_serve_login_page(self):
        url = f"http://127.0.0.1:{self.port}/login"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers["Content-Type"])
            content = resp.read().decode("utf-8")
            self.assertIn("Firebase", content)
            self.assertIn("Google", content)

    def test_serve_msg_page(self):
        url = f"http://127.0.0.1:{self.port}/msg"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers["Content-Type"])
            content = resp.read().decode("utf-8")
            self.assertIn("SCAN SUSPICIOUS MESSAGE", content)

    def test_serve_analysis_page(self):
        url = f"http://127.0.0.1:{self.port}/analysis"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers["Content-Type"])
            content = resp.read().decode("utf-8")
            self.assertIn("RISK ANALYSIS DASHBOARD", content)

    def test_serve_predict_page(self):
        url = f"http://127.0.0.1:{self.port}/predict"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers["Content-Type"])
            content = resp.read().decode("utf-8")
            self.assertIn("PREDICTIVE METHODS", content)

    def test_get_auth_config(self):
        url = f"http://127.0.0.1:{self.port}/api/auth/config"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertIn("configured", data)

    def test_post_analyze_scam(self):
        url = f"http://127.0.0.1:{self.port}/api/analyze"
        payload = json.dumps({"text": "Your account will be blocked within 24 hours. Send OTP immediately.", "language": "en"}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["concern_level"], "High concern")
            self.assertGreaterEqual(data["risk_score"], 70)

    def test_post_analyze_empty(self):
        url = f"http://127.0.0.1:{self.port}/api/analyze"
        payload = json.dumps({"text": ""}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "empty")

    def test_serve_static_css(self):
        url = f"http://127.0.0.1:{self.port}/static/css/style.css"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/css", resp.headers["Content-Type"])

    def test_post_feedback(self):
        url = f"http://127.0.0.1:{self.port}/api/feedback"
        payload = json.dumps({"feedback_type": "helpful_scam", "risk_score": 88}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "received")

    def test_directory_traversal_prevention(self):
        url = f"http://127.0.0.1:{self.port}/static/../../app.py"
        req = urllib.request.Request(url)
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=3)
        self.assertEqual(ctx.exception.code, 404)
        ctx.exception.close()

    def test_get_model_info(self):
        url = f"http://127.0.0.1:{self.port}/api/model-info"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertIn("ml_model", data)
            self.assertIn("ai_provider", data)
            self.assertIn("detection_pillars", data)

    def test_post_ml_predict(self):
        url = f"http://127.0.0.1:{self.port}/api/ml-predict"
        payload = json.dumps({"text": "Dear user, you won lottery cash prize"}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertIn("is_spam", data)
            self.assertIn("spam_probability", data)

    def test_post_configure_ai(self):
        url = f"http://127.0.0.1:{self.port}/api/configure-ai"
        payload = json.dumps({"provider": "openai", "api_key": "sk-test1234567890abcdef"}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "configured")
            self.assertEqual(data["ai_provider"]["provider"], "OpenAI (ChatGPT)")

    def test_post_retrain_model(self):
        url = f"http://127.0.0.1:{self.port}/api/retrain"
        req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "retrained")
            self.assertIn("model", data)

if __name__ == "__main__":
    unittest.main()
