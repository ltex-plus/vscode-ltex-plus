#!/usr/bin/env python3
"""Export package.nls{,.<locale>}.json into a readable Markdown report.

Useful for reviewing the actual prose VS Code shows (tooltips, hover
descriptions, full docs strings) without wading through the raw JSON's
escaped \\n's and one-line-per-entry layout.

Example:

    python3 tools/exportNlsToMarkdown.py
    python3 tools/exportNlsToMarkdown.py --nls package.nls.de.json --output nls-report-de.md
"""

import argparse
import json
import pathlib
import re
from collections import OrderedDict
from typing import Any, Dict, List, Tuple

KIND_LABELS = {
    "markdownDescription": "Short description (markdownDescription, VS Code tooltip)",
    "fullMarkdownDescription": "Full description (fullMarkdownDescription, docs site)",
    "fullMarkdownExamples": "Examples block (fullMarkdownExamples, docs site only)",
    "description": "Description (description)",
    "title": "Title (title)",
    "displayName": "Display name (displayName)",
    "scopeDescription": "Scope description (scopeDescription)",
}

# A flat-leaf kind is a key whose final component identifies an NLS field on
# its parent (so the parent groups all these leaves together).
LEAF_KINDS = set(KIND_LABELS.keys()) | {
    "markdownEnumDescription",
    "enumDescription",
    "aliasOf",
    "serverOnly",
}


def split_key(key: str) -> Tuple[str, str, str]:
    """Return (category, parent, leaf).

    - category: top-level grouping ("configuration", "walkthrough", "command", or the first component if unknown).
    - parent: dot-separated path identifying which thing the leaf describes (e.g. "ltex.language", "ltex.dictionary.fr-FR").
    - leaf: the final NLS field name (markdownDescription, aliasOf, ...).
    """
    if not key.startswith("ltex.i18n."):
        return ("other", key, "")
    rest = key[len("ltex.i18n.") :]
    parts = rest.split(".")
    if not parts:
        return ("other", key, "")
    category = parts[0]
    body = parts[1:]
    if not body:
        return (category, "", "")
    if body[-1] in LEAF_KINDS:
        return (category, ".".join(body[:-1]), body[-1])
    return (category, ".".join(body), "")


def render_value(value: str) -> str:
    """Render a multi-line markdown string with explicit newlines preserved."""
    # JSON values often use \n (literal newline); preserve as-is so the report
    # renders the embedded markdown structure (lists, headings, blockquotes).
    return value.rstrip()


def render_setting_entry(parent: str, fields: Dict[str, str]) -> List[str]:
    out: List[str] = [f"### `{parent}`\n"]

    # Top-level prose fields, in a stable order
    for kind in [
        "markdownDescription",
        "fullMarkdownDescription",
        "fullMarkdownExamples",
        "description",
        "title",
        "scopeDescription",
    ]:
        if kind in fields:
            label = KIND_LABELS.get(kind, kind)
            out.append(f"**{label}:**\n")
            out.append(render_value(fields[kind]))
            out.append("")
    for kind, value in fields.items():
        if kind in {
            "markdownDescription",
            "fullMarkdownDescription",
            "fullMarkdownExamples",
            "description",
            "title",
            "scopeDescription",
            "displayName",
        }:
            continue
        if kind in {
            "markdownEnumDescription",
            "enumDescription",
            "aliasOf",
            "serverOnly",
        }:
            continue  # handled at the parent level for enum-typed settings
        label = KIND_LABELS.get(kind, kind)
        out.append(f"**{label}:**\n")
        out.append(render_value(value))
        out.append("")
    return out


def collect_enum_table(
    setting_name: str,
    by_parent: Dict[str, Dict[str, str]],
    by_subkey: Dict[str, Dict[str, str]],
) -> List[str]:
    """If setting_name has children of the form `<setting>.<code>` with leaf NLS fields, render them as a table.

    Returns lines or an empty list.
    """
    prefix = setting_name + "."
    rows: List[Tuple[str, Dict[str, str]]] = []
    for child_parent, fields in by_parent.items():
        if not child_parent.startswith(prefix):
            continue
        code = child_parent[len(prefix) :]
        if "." in code:
            continue  # deeper nesting; not a flat enum-style child
        rows.append((code, fields))
    if not rows:
        return []

    # Determine columns based on leaf kinds present anywhere
    kind_set: set = set()
    for _, fields in rows:
        kind_set.update(fields.keys())
    columns: List[str] = []
    for k in [
        "markdownEnumDescription",
        "enumDescription",
        "markdownDescription",
        "aliasOf",
        "serverOnly",
    ]:
        if k in kind_set:
            columns.append(k)
    for k in sorted(kind_set):
        if k not in columns:
            columns.append(k)

    out: List[str] = ["**Per-key NLS entries:**\n"]
    out.append("| Code | " + " | ".join(columns) + " |")
    out.append("|" + "---|" * (1 + len(columns)))
    for code, fields in sorted(rows, key=lambda r: r[0]):
        cells = [f"`{code}`"]
        for col in columns:
            v = fields.get(col, "")
            # Compact for tables: truncate long values, escape pipes and newlines
            v = v.replace("\n", " ").replace("|", "\\|").rstrip()
            if len(v) > 200:
                v = v[:200] + "…"
            cells.append(v)
        out.append("| " + " | ".join(cells) + " |")
    out.append("")
    return out


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--nls", default="package.nls.json", type=pathlib.Path)
    parser.add_argument("--output", default="nls-report.md", type=pathlib.Path)
    args = parser.parse_args()

    data: Dict[str, Any] = json.loads(args.nls.read_text())

    # Group entries: by_category[parent][leaf] -> value
    by_category: Dict[str, Dict[str, Dict[str, str]]] = {}
    for key, value in data.items():
        category, parent, leaf = split_key(key)
        by_category.setdefault(category, OrderedDict()).setdefault(
            parent, OrderedDict()
        )[leaf or "(root)"] = value

    out: List[str] = []
    out.append(f"# NLS messages from `{args.nls.name}`\n")
    out.append(
        f"Generated by `tools/exportNlsToMarkdown.py`. Each setting / message is shown with its real prose (no `\\n` escapes, no one-line collapsing). Tables list per-key entries (enum values, per-language descriptions, etc.).\n"
    )

    category_order = ["configuration", "walkthrough", "command", "other"]
    for category in category_order + sorted(
        c for c in by_category if c not in category_order
    ):
        if category not in by_category:
            continue
        out.append(f"## Category: `{category}`\n")
        by_parent = by_category[category]

        # Identify "top-level" parents (those not nested inside another)
        parents = list(by_parent.keys())
        top_parents = []
        for p in parents:
            is_nested = any(p != q and p.startswith(q + ".") for q in parents)
            if not is_nested:
                top_parents.append(p)
        top_parents.sort()

        for parent in top_parents:
            fields = {k: v for k, v in by_parent[parent].items() if k != "(root)"}
            out.extend(render_setting_entry(parent, fields))
            out.extend(collect_enum_table(parent, by_parent, {}))

    text = "\n".join(out).rstrip() + "\n"
    args.output.write_text(text)
    print(f"Wrote {args.output} ({len(text):,} chars)")


if __name__ == "__main__":
    main()
