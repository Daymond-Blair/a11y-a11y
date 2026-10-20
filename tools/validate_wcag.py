#!/usr/bin/env python3
"""Validate data/wcag-criteria.json against the official W3C WCAG 2.2 Recommendation.

Checks that the file contains exactly the active Level A and AA success criteria,
with ids, names and levels matching the spec, and that every required field is
present and non-empty. Also checks the scenario answer keys reference valid ids.

Usage:
    python3 tools/validate_wcag.py              # fetch the spec from w3.org
    python3 tools/validate_wcag.py spec.html    # use a saved copy of the spec
"""

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

SPEC_URL = "https://www.w3.org/TR/WCAG22/"
ROOT = Path(__file__).resolve().parent.parent
REQUIRED = ["id", "name", "level", "definition", "testing_technique", "failures"]


def load_spec(path=None):
    if path:
        return Path(path).read_text(encoding="utf-8")
    with urllib.request.urlopen(SPEC_URL, timeout=30) as resp:
        return resp.read().decode("utf-8")


def parse_spec(source):
    """Return {id: (name, level)} for active A/AA criteria in the spec."""
    criteria = {}
    pattern = r'Success Criterion (\d+\.\d+\.\d+) </bdi>([^<]+)</h4>(.*?)</section>'
    for match in re.finditer(pattern, source, re.S):
        sc_id, name, body = match.group(1), html.unescape(match.group(2)).strip(), match.group(3)
        level = re.search(r"\(Level (A{1,3})\)", body)
        if not level or "obsolete" in name.lower():
            continue
        if level.group(1) in ("A", "AA"):
            criteria[sc_id] = (name, level.group(1))
    return criteria


def main():
    errors = []
    spec = parse_spec(load_spec(sys.argv[1] if len(sys.argv) > 1 else None))
    if len(spec) < 50:
        sys.exit(f"Parsed only {len(spec)} criteria from the spec; its markup may have changed.")

    data = json.loads((ROOT / "data" / "wcag-criteria.json").read_text(encoding="utf-8"))
    local = {}
    for entry in data["criteria"]:
        for field in REQUIRED:
            if not entry.get(field):
                errors.append(f"{entry.get('id', '?')}: missing or empty '{field}'")
        if not isinstance(entry.get("failures"), list):
            errors.append(f"{entry.get('id')}: 'failures' must be an array")
        if entry["id"] in local:
            errors.append(f"{entry['id']}: duplicate entry")
        local[entry["id"]] = entry

    for sc_id, (name, level) in spec.items():
        entry = local.get(sc_id)
        if not entry:
            errors.append(f"{sc_id} {name} ({level}): missing from JSON")
            continue
        if entry["name"] != name:
            errors.append(f"{sc_id}: name '{entry['name']}' != spec '{name}'")
        if entry["level"] != level:
            errors.append(f"{sc_id}: level {entry['level']} != spec {level}")
    for sc_id in local.keys() - spec.keys():
        errors.append(f"{sc_id}: not an active A/AA criterion in WCAG 2.2")

    for key_file in sorted((ROOT / "data" / "answer-keys").glob("*.json")):
        key = json.loads(key_file.read_text(encoding="utf-8"))
        attempt_js = ROOT / "scenarios" / key_file.stem / "attempt.js"
        if attempt_js.exists():
            groups = re.search(r"groups: \[(.*?)\],\s*(?:classic|\}\))", attempt_js.read_text(encoding="utf-8"), re.S)
            pool = set(re.findall(r'"([A-Z]\d+)"', groups.group(1))) if groups else set()
            key_ids = {v["id"] for v in key["violations"]}
            if pool != key_ids:
                errors.append(f"{key_file.name}: ids {sorted(key_ids ^ pool)} differ between answer key and attempt.js")
        for v in key["violations"]:
            for sc_id in [v["wcag"], *v.get("related_wcag", [])]:
                if sc_id not in local:
                    errors.append(f"{key_file.name} {v['id']}: unknown criterion {sc_id}")

    counts = {lvl: sum(1 for e in local.values() if e["level"] == lvl) for lvl in ("A", "AA")}
    if errors:
        print("FAILED")
        print("\n".join(f"  - {e}" for e in errors))
        sys.exit(1)
    print(f"OK: {len(local)} criteria ({counts['A']} A, {counts['AA']} AA) match {SPEC_URL}")


if __name__ == "__main__":
    main()
