"""Comprehensive Regression Test Suite for ScamDetector."""

import unittest
from core.detector import ScamDetector

class TestScamDetector(unittest.TestCase):
    """Verifies scam detection accuracy across all official test cases."""

    def setUp(self):
        self.detector = ScamDetector(use_ai=False)

    def test_reported_failure_electricity_verification(self):
        """Reported failure: Electricity payment mismatch + temporary interruption + ₹2 verification charge."""
        msg = (
            "Dear Customer, your latest electricity payment could not be matched "
            "to your consumer account. If you have already paid, please do not make "
            "the full payment again. To avoid a temporary service interruption, "
            "complete the payment-mapping verification by 6:00 PM today at "
            "https://billing-review.example/verify. A refundable ₹2 verification "
            "charge applies. For assistance, reply HELP to this message. "
            "— Customer Billing Support"
        )
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")
        self.assertGreaterEqual(res["risk_score"], 70)
        quotes = [e["quote"] for e in res["evidence"]]
        self.assertTrue(any("service interruption" in q for q in quotes))
        self.assertTrue(any("6:00 PM today" in q for q in quotes))
        self.assertTrue(any("https://billing-review.example/verify" in q for q in quotes))
        self.assertTrue(any("refundable ₹2 verification charge" in q or "verification charge" in q for q in quotes))

    def test_reported_failure_variations(self):
        """Independent variations with different amounts, times, and discom names."""
        var1 = "To avoid service interruption complete verification by 8:00 PM today at https://power-pay.info/verify. Refundable Rs 5 fee applies."
        res1 = self.detector.analyze(var1)
        self.assertEqual(res1["concern_level"], "High concern")

        var2 = "Prevent service interruption! Pay refundable INR 1 verification charge at https://billing.example/payment before 5 PM today."
        res2 = self.detector.analyze(var2)
        self.assertEqual(res2["concern_level"], "High concern")

    def test_case_a_strong_scam_indicators(self):
        """CASE A: Disconnection threat, contact officer, support app install, pay ₹10."""
        msg = "Dear consumer your electricity power will be disconnected tonight at 9:30 PM. Call officer at 9876543210 or install support.apk to pay Rs 10 fee. Do not contact local office."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")
        self.assertGreaterEqual(res["risk_score"], 70)

    def test_case_b_legitimate_otp_notification(self):
        """CASE B: Legitimate-style OTP with warning not to share code."""
        msg = "Your OTP for login to SBI NetBanking is 482910. Valid for 10 mins. DO NOT SHARE THIS OTP WITH ANYONE. State Bank never asks for OTP or PIN."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "No obvious warning signs found")
        self.assertLessEqual(res["risk_score"], 30)

    def test_case_c_ambiguous_payment_request(self):
        """CASE C: 'Hi, can you send ₹500? I need it urgently.' -> Needs verification."""
        msg = "Hi, can you please send ₹500? I need it urgently."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "Needs verification")
        self.assertGreater(len(res["follow_up_questions"]), 0)

        # Context escalation: if user says sender is unknown -> High concern
        res_esc = self.detector.analyze(msg, user_context={"q_sender_known": "no_unknown"})
        self.assertEqual(res_esc["concern_level"], "High concern")

    def test_case_d_explicit_disclosure_request(self):
        """CASE D: Account blocked threat + demand to send received OTP immediately."""
        msg = "Your bank account will be blocked within 24 hours. Reply with your 6-digit OTP immediately to verify."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")

    def test_case_e_legitimate_bill_reminder(self):
        """CASE E: Routine bill reminder directing user to standard app."""
        msg = "Your monthly bill is available. Open the service app you normally use to view your bill and due date."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "No obvious warning signs found")
        self.assertLessEqual(res["risk_score"], 30)

    def test_digital_arrest_scam(self):
        """Fake police/CBI digital arrest must trigger High concern."""
        msg = "This is CBI Crime Branch. A parcel in your name was seized at airport with narcotics. You are in Digital Arrest. Join Skype video call immediately."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")
        self.assertGreaterEqual(res["risk_score"], 80)

    def test_remote_access_anydesk_scam(self):
        """Request to install AnyDesk or TeamViewer must trigger High concern."""
        msg = "To refund your money, please install AnyDesk on your mobile phone."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")

    def test_otp_credential_theft_scam(self):
        """Demanding user to share or send OTP must trigger High concern."""
        msg = "Please share your 6-digit OTP to unblock your account."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")

    def test_electricity_disconnection_scam(self):
        """Electricity cutoff SMS must trigger High concern with exact evidence."""
        msg = "Dear consumer, electricity power will be cutoff tonight at 9:30 PM from electricity office. Call officer at 9876543210."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")

    def test_ambiguous_shortlink_message(self):
        """Message with only a shortened URL and vague text should trigger Needs verification."""
        msg = "Check your account update here: bit.ly/my-account-status"
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "Needs verification")

    def test_legitimate_account_credit_alert(self):
        """Standard transactional debit/credit alert should not trigger false alarm."""
        msg = "INR 2,500.00 credited to your a/c ending 1234 on 15-Oct-26 via UPI. Balance: INR 15,200.00."
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "No obvious warning signs found")

    def test_empty_and_whitespace_input(self):
        """Empty input should return empty status and not crash."""
        res = self.detector.analyze("   ")
        self.assertEqual(res["status"], "empty")
        self.assertEqual(res["concern_level"], "Needs verification")

    def test_very_long_input(self):
        """Very long input (8,000 chars) should be processed gracefully without freezing."""
        msg = "Dear customer " * 500 + " send OTP immediately"
        res = self.detector.analyze(msg)
        self.assertEqual(res["concern_level"], "High concern")

    def test_hindi_language_translation(self):
        """Requesting analysis in Hindi should yield Hindi summary and action points."""
        msg = "Please send OTP immediately"
        res = self.detector.analyze(msg, language="hi")
        self.assertTrue(len(res["summary_hi"]) > 0)

    def test_full_response_contract(self):
        """Ensures all required shared response contract fields exist and are well-formed."""
        msg = "Dear customer, your electricity will be disconnected tonight at 9:30 PM. Install bill.apk."
        res = self.detector.analyze(msg)
        required_keys = [
            "status", "analysis_mode", "concern_level", "risk_score", "risk_category",
            "concern_badge", "primary_threat", "requested_actions", "evidence",
            "reasons", "unknowns", "safe_next_actions", "help_me_say_no_script",
            "follow_up_questions", "user_context", "summary", "summary_en",
            "summary_hi", "highlighted_html", "language", "engine_used",
            "engine_note", "latency_ms", "disclaimer"
        ]
        for key in required_keys:
            self.assertIn(key, res, f"Response missing required key: {key}")

if __name__ == "__main__":
    unittest.main()
