"""Tests for Machine Learning Spam Model and OpenAI ChatGPT Integration."""

import unittest
from core.ml_model import SpamClassifier, PurePythonNaiveBayes, tokenize
from core.llm_adapter import LLMAdapter


class TestMLSpamClassifier(unittest.TestCase):
    """Verifies that the ML model correctly learns spam patterns and classifies messages."""

    def setUp(self):
        self.classifier = SpamClassifier.get_instance()

    def test_tokenizer(self):
        tokens = tokenize("Win Rs 50000 cash prize at https://example.com/link")
        self.assertIn("token_curr", tokens)
        self.assertIn("token_url", tokens)
        self.assertIn("prize", tokens)

    def test_predict_obvious_scam(self):
        text = "URGENT: Your bank account will be blocked in 24 hours. Update KYC at bank-verify.example and share your OTP."
        res = self.classifier.predict(text)
        self.assertTrue(res["is_spam"])
        self.assertGreater(res["spam_probability"], 0.70)
        self.assertIn("confidence", res)

    def test_predict_obvious_ham(self):
        text = "Hey Mom, I reached home safely. Will call you after dinner."
        res = self.classifier.predict(text)
        self.assertFalse(res["is_spam"])
        self.assertLess(res["spam_probability"], 0.40)

    def test_pure_python_naive_bayes(self):
        nb = PurePythonNaiveBayes()
        train_texts = [
            "win free cash prize click link now",
            "urgent account blocked share otp",
            "hey are you free for lunch today",
            "meeting scheduled for tomorrow morning"
        ]
        train_labels = ["spam", "spam", "ham", "ham"]
        nb.fit(train_texts, train_labels)

        spam_p = nb.predict_proba("win cash prize now")
        ham_p = nb.predict_proba("see you at lunch tomorrow")
        self.assertGreater(spam_p, 0.5)
        self.assertLess(ham_p, 0.5)

    def test_model_metadata(self):
        info = self.classifier.get_info()
        self.assertIn("model_type", info)
        self.assertIn("samples_count", info)
        self.assertGreater(info["samples_count"], 0)


class TestLLMAdapter(unittest.TestCase):
    """Verifies external AI adapter behavior, OpenAI support, and fail-safe fallbacks."""

    def test_default_offline_behavior(self):
        adapter = LLMAdapter(api_key=None)
        # Without keys in env, should report not available
        info = adapter.get_provider_info()
        self.assertIn("provider", info)
        res = adapter.analyze_message("Test message")
        self.assertTrue(res["fallback_required"])

    def test_openai_key_configuration(self):
        adapter = LLMAdapter()
        adapter.set_openai_key("sk-test1234567890abcdef")
        self.assertTrue(adapter.is_available())
        info = adapter.get_provider_info()
        self.assertEqual(info["provider"], "OpenAI (ChatGPT)")
        self.assertIn("sk-t...cdef", info["key_status"])

    def test_parse_ai_json_with_code_fences(self):
        adapter = LLMAdapter()
        raw_json = '```json\n{"concern_level": "High concern", "primary_threat": "OTP Phishing", "simple_explanation": "Demands credentials", "safe_next_actions": ["Do not share OTP"]}\n```'
        parsed = adapter._parse_ai_response(raw_json, "openai")
        self.assertFalse(parsed["fallback_required"])
        self.assertEqual(parsed["concern_level"], "High concern")
        self.assertEqual(parsed["ai_provider"], "OpenAI ChatGPT")

    def test_parse_invalid_json_falls_back(self):
        adapter = LLMAdapter()
        parsed = adapter._parse_ai_response("This is not valid JSON at all", "openai")
        self.assertTrue(parsed["fallback_required"])


if __name__ == "__main__":
    unittest.main()
