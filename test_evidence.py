"""Tests for Evidence Extraction and Highlighting."""

import unittest
from core.evidence import EvidenceExtractor
from core.patterns import ACTION_PATTERNS

class TestEvidenceIntegrity(unittest.TestCase):
    """Ensures verbatim quote matching and safe HTML escaping."""

    def test_verbatim_evidence_matching(self):
        sample = "Please send OTP immediately to verify your account."
        pattern = ACTION_PATTERNS[0]  # credential_otp_pin
        matches = EvidenceExtractor.extract_matches(sample, pattern)
        for m in matches:
            quote = m["quote"]
            self.assertIn(quote, sample, f"Quote '{quote}' must exist verbatim in sample")

    def test_html_highlight_escaping(self):
        malicious = "<script>alert('xss')</script> send OTP now"
        pattern = ACTION_PATTERNS[0]
        matches = EvidenceExtractor.extract_matches(malicious, pattern)
        html_out = EvidenceExtractor.generate_highlighted_html(malicious, matches)
        self.assertNotIn("<script>", html_out)
        self.assertIn("&lt;script&gt;", html_out)

if __name__ == "__main__":
    unittest.main()
