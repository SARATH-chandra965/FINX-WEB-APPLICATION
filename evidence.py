"""Evidence Extraction and Highlighting Engine.

Ensures every extracted quote is an exact, verbatim substring of the submitted text.
Generates safe, sanitized highlighted HTML for display.
"""

import html
from typing import Dict, List, Any

class EvidenceExtractor:
    """Extracts verifiable text evidence spans with high forensic integrity."""

    @staticmethod
    def extract_matches(text: str, pattern_def: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Finds all occurrences of a pattern regex in text, returning exact spans."""
        matches = []
        for m in pattern_def["regex"].finditer(text):
            quote = m.group(0).strip()
            # Double check verbatim substring guarantee
            if quote and quote in text:
                matches.append({
                    "id": pattern_def.get("id"),
                    "category": pattern_def["category"],
                    "severity": pattern_def.get("severity", "MEDIUM"),
                    "standard_action": pattern_def.get("standard_action", "OTHER_OR_UNCLEAR"),
                    "quote": quote,
                    "start": m.start(),
                    "end": m.end(),
                    "explanation_en": pattern_def.get("explanation_en", ""),
                    "explanation_hi": pattern_def.get("explanation_hi", ""),
                    "explanation_te": pattern_def.get("explanation_te", "")
                })
        return matches

    @staticmethod
    def deduplicate_and_merge_spans(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicates quotes and resolves overlapping character spans."""
        if not matches:
            return []

        # Sort by start offset ascending, then length descending
        sorted_m = sorted(matches, key=lambda x: (x["start"], -(x["end"] - x["start"])))
        merged = []
        seen_quotes = set()

        for curr in sorted_m:
            quote_norm = curr["quote"].lower()
            if quote_norm in seen_quotes:
                continue

            # Check overlap with last added span
            if merged and curr["start"] < merged[-1]["end"]:
                # If current has higher severity, replace or skip
                if curr.get("severity") == "CRITICAL" and merged[-1].get("severity") != "CRITICAL":
                    merged[-1] = curr
                    seen_quotes.add(quote_norm)
                continue

            merged.append(curr)
            seen_quotes.add(quote_norm)

        return merged

    @staticmethod
    def generate_highlighted_html(text: str, evidence_list: List[Dict[str, Any]]) -> str:
        """Constructs safe HTML with highlighted `<mark>` spans for detected evidence."""
        if not text:
            return ""

        if not evidence_list:
            return html.escape(text)

        # Sort non-overlapping spans by start offset
        spans = sorted(evidence_list, key=lambda x: x["start"])
        parts = []
        last_idx = 0

        for item in spans:
            start, end = item["start"], item["end"]
            if start < last_idx:
                continue

            # Append escaped text before the match
            parts.append(html.escape(text[last_idx:start]))

            # Append highlighted mark tag
            quote_text = html.escape(text[start:end])
            css_class = "hl-critical" if item.get("severity") == "CRITICAL" else "hl-warning"
            cat = html.escape(item.get("category", "Warning"))
            parts.append(f'<mark class="evidence-highlight {css_class}" title="{cat}">{quote_text}</mark>')
            last_idx = end

        # Append remaining text
        parts.append(html.escape(text[last_idx:]))
        return "".join(parts)
