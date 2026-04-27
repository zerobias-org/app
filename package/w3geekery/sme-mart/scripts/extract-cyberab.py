#!/usr/bin/env python3
"""
Extract CMMC/SCF/SCA roles and certifications from the cyberab.org mirror.

Reads HTML files from the mirror (default /tmp/cyberab-mirror/cyberab.org)
and produces a structured JSON catalog of roles, certifications, and their
relationships. Output goes to stdout (pipe to jq or redirect to a file).

Usage:
    python3 scripts/extract-cyberab.py > /tmp/cyberab-extract.json
    python3 scripts/extract-cyberab.py /some/other/mirror > catalog.json

The extractor is intentionally dumb — it pulls tables, headings, and section
text verbatim. Hand-curation into the final catalog happens downstream in the
proposal markdown.
"""
import json
import os
import re
import sys
from html.parser import HTMLParser


MIRROR = sys.argv[1] if len(sys.argv) > 1 else "/tmp/cyberab-mirror/cyberab.org"

# Pages grouped by ecosystem
PAGES = {
    "cmmc": {
        "ecosystem_overview": "CMMC-Ecosystem/Ecosystem-Roles.html",
        "assessing": "CMMC-Ecosystem/Ecosystem-Roles/Assessing-and-Certification.html",
        "assessors": "CMMC-Ecosystem/Ecosystem-Roles/Assessors.html",
        "consulting": "CMMC-Ecosystem/Ecosystem-Roles/Consulting-and-Implementation.html",
        "training_orgs": "CMMC-Ecosystem/Ecosystem-Roles/Training-and-Instruction.html",
        "training_instructors": "CMMC-Ecosystem/Ecosystem-Roles/Training-and-Instructors.html",
        "osc_dib": "CMMC-Ecosystem/Ecosystem-Roles/DIB-Companies-OSCs.html",
        "what_is_cmmc": "CMMC-Ecosystem/What-is-CMMC.html",
    },
    "scf": {
        "ecosystem_overview": "SCF-Ecosystem/Ecosystem-Roles.html",
        "certifications": "SCF-Ecosystem/SCF-Certifications.html",
        "what_is_scf": "SCF-Ecosystem/What-is-SCF.html",
    },
    "sca": {
        "what_is_sca": "SCA-Ecosystem/What-is-SCA.html",
    },
    "registration": {
        "RP": "RP-Registration.html",
        "RPA": "RPA-Registration.html",
        "RPO": "RPO-Registration.html",
        "RPOSCF": "RPOSCF-Registration.html",
        "APOSCF": "APOSCF-Registration.html",
        "APPSCF": "APPSCF-Registration.html",
        "TPAOSCF": "TPAOSCF-Registration.html",
        "SDOSCA": "SDOSCA-Registration.html",
        "c3pao": "c3pao-registration.html",
        "ltp": "LTP-Registration.html",
        "osc": "osc-registration.html",
        "cci": "CMMC-Certified-Instructor-Program.html",
    },
    "accreditation": {
        "17011": "Accreditation/ISO-IEC-17011.html",
        "17020": "Accreditation/ISO-IEC-17020.html",
        "17024": "Accreditation/ISO-IEC-17024.html",
        "general": "Accreditation/General-Accreditation.html",
    },
    "terminology": {
        "terms": "Resources/Terminology.html",
    },
}


class TextExtractor(HTMLParser):
    """Strip tags, yielding plain text (skip script/style/nav/footer/head)."""

    SKIP = {"script", "style", "nav", "footer", "head", "noscript"}

    def __init__(self):
        super().__init__()
        self.out = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data):
        if not self.skip_depth:
            self.out.append(data)

    def handle_entityref(self, name):
        # cheap common cases
        if not self.skip_depth:
            self.out.append({"amp": "&", "lt": "<", "gt": ">", "nbsp": " ", "ndash": "-", "mdash": "-"}.get(name, f"&{name};"))


def strip_tags(html: str) -> str:
    ex = TextExtractor()
    ex.feed(html)
    txt = "".join(ex.out)
    return re.sub(r"\s+", " ", txt).strip()


def extract_tables(html: str) -> list:
    """Return a list of tables, each a list of row-cell strings."""
    tables = []
    for tm in re.finditer(r"<table[^>]*>(.*?)</table>", html, re.DOTALL | re.IGNORECASE):
        rows = []
        for rm in re.finditer(r"<tr[^>]*>(.*?)</tr>", tm.group(1), re.DOTALL | re.IGNORECASE):
            cells = []
            for cm in re.finditer(r"<t[dh][^>]*>(.*?)</t[dh]>", rm.group(1), re.DOTALL | re.IGNORECASE):
                txt = strip_tags(cm.group(1))
                cells.append(txt)
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables


def extract_headings(html: str) -> list:
    heads = []
    for hm in re.finditer(r"<(h[1-6])[^>]*>(.*?)</\1>", html, re.DOTALL | re.IGNORECASE):
        level = int(hm.group(1)[1])
        text = strip_tags(hm.group(2))
        if text:
            heads.append({"level": level, "text": text})
    return heads


def extract_lists(html: str) -> list:
    """Bullet/numbered lists — return a list of list-of-items."""
    lists = []
    for lm in re.finditer(r"<(ul|ol)[^>]*>(.*?)</\1>", html, re.DOTALL | re.IGNORECASE):
        items = [strip_tags(im.group(1)) for im in re.finditer(r"<li[^>]*>(.*?)</li>", lm.group(2), re.DOTALL | re.IGNORECASE)]
        items = [i for i in items if i]
        if items:
            lists.append(items)
    return lists


def extract_main(html: str) -> str:
    """Approximate page body text — everything minus tables (which we've already pulled)."""
    # Strip tables so body text doesn't duplicate them
    body = re.sub(r"<table[^>]*>.*?</table>", "", html, flags=re.DOTALL | re.IGNORECASE)
    return strip_tags(body)


def extract_page(path: str) -> dict:
    full = os.path.join(MIRROR, path)
    if not os.path.exists(full):
        return {"path": path, "error": "missing"}
    html = open(full, encoding="utf-8", errors="replace").read()
    return {
        "path": path,
        "source_url": f"https://cyberab.org/{path.replace('.html', '')}",
        "headings": extract_headings(html),
        "tables": extract_tables(html),
        "lists": extract_lists(html)[:40],  # cap noise
        "body_excerpt": extract_main(html)[:8000],
    }


def main():
    out = {}
    for group, pages in PAGES.items():
        out[group] = {key: extract_page(path) for key, path in pages.items()}
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
