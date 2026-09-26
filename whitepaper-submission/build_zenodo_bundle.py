#!/usr/bin/env python3
"""
ZENODO BUNDLE BUILDER - Silent Spirits Legacy whitepaper submission
====================================================================
Packages every artifact a reviewer or archivist needs into one
versioned ZIP ready for Zenodo (DOI) upload:

  1. Canonical whitepaper + evidence chain (WHITEPAPER, EVIDENCE_INDEX,
     DISCOVERY, PRIOR_ART, SHA256SUMS)
  2. The two validation scripts + their serialized results
  3. The keyword ontology module they import (frequency_principles.py)
  4. Raw cleaned corpora + controls (full reproducibility)
  5. Analysis outputs (pillar2, pillar4, bible-analysis), manifest, tests,
     concept graph

The canonical WHITEPAPER.md is the single source of truth and is COPIED
in fresh on every build - the bundle is a build artifact, never edited.
Every file in the bundle is hashed into MANIFEST.txt, and the 10 entries
of the project's SHA256SUMS are re-verified against the copies before
the ZIP is created. Build fails loudly on any mismatch.

Usage:  python build_zenodo_bundle.py            (from anywhere)
Output: whitepaper-submission/zenodo_bundle/     (staging dir)
        whitepaper-submission/zenodo_bundle_v1.zip
"""

import hashlib
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path


def _ignore_pycache(dir, names):
    """shutil.copytree ignore callback: skip bytecode caches and build junk."""
    return {n for n in names if n == "__pycache__" or n.endswith((".pyc", ".pyo"))}

HERE = Path(__file__).resolve().parent          # whitepaper-submission/
ROOT = HERE.parent

BUNDLE_DIR = HERE / "zenodo_bundle"
ZIP_PATH = HERE / "zenodo_bundle_v1.zip"
VERSION = "v1"
BUILD_DATE = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# (source relative to repo root, destination inside bundle)
FILES = [
    # canonical whitepaper chain
    ("whitepaper-submission/WHITEPAPER.md",        "whitepaper/WHITEPAPER.md"),
    ("whitepaper-submission/EVIDENCE_INDEX.md",    "whitepaper/EVIDENCE_INDEX.md"),
    ("whitepaper-submission/DISCOVERY.md",         "whitepaper/DISCOVERY.md"),
    ("whitepaper-submission/PRIOR_ART.md",         "whitepaper/PRIOR_ART.md"),
    ("whitepaper-submission/SHA256SUMS",           "whitepaper/SHA256SUMS"),
    # validation suite (layer 1 + layer 2) + shared ontology module
    ("research/pillars/pillar4_frequency_principles/statistical_validation.py",
     "code/statistical_validation.py"),
    ("research/pillars/pillar4_frequency_principles/keyword_sensitivity.py",
     "code/keyword_sensitivity.py"),
    ("research/pillars/pillar4_frequency_principles/frequency_principles.py",
     "code/frequency_principles.py"),
    ("research/pillars/pillar4_frequency_principles/outputs/statistical_validation_results.json",
     "results/statistical_validation_results.json"),
    ("research/pillars/pillar4_frequency_principles/outputs/keyword_sensitivity_results.json",
     "results/keyword_sensitivity_results.json"),
    # primary research outputs
    ("research/pillars/pillar2_ai_pattern/outputs/specificity_ratio_2.667x.json",
      "results/specificity_ratio_2.667x.json"),
    ("research/pillars/pillar2_ai_pattern/outputs/pillar2_full_corpora_results.json",
      "results/pillar2_full_corpora_results.json"),
    ("research/pillars/pillar4_frequency_principles/outputs/pillar4_frequency_principles.json",
      "results/pillar4_frequency_principles.json"),
    ("meditation-app/outputs/master_manifest.json",
      "results/master_manifest.json"),
    ("research/pillars/pillar2_ai_pattern/reconstruct_hebrew_bert.py",
      "code/reconstruct_hebrew_bert.py"),
    ("research/pillars/pillar2_ai_pattern/outputs/reconstruction_hebrew_bert.json",
      "results/reconstruction_hebrew_bert.json"),
    ("bible-analysis/dss_1qs.txt",
      "corpora/raw/dss_1qs.txt"),
    ("bible-analysis/dss_1qs_hebrew.txt",
      "corpora/raw/dss_1qs_hebrew.txt"),
    # concept network frontier
    ("build_graph.py",          "code/build_graph.py"),
    ("concept_graph.html",      "results/concept_graph.html"),
]

# whole directories copied verbatim
DIRS = [
    ("research/pillars/pillar4_frequency_principles/data/cleaned",  "corpora/cleaned"),
    ("research/pillars/pillar4_frequency_principles/data/controls", "corpora/controls"),
    ("bible-analysis/outputs",   "results/bible_analysis_outputs"),
    ("tests",                    "code/tests"),
]

# canonical SHA256SUMS entries that MUST verify inside the bundle
SUMS_REL = "whitepaper/SHA256SUMS"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest().upper()


def main():
    print("=" * 70)
    print(f"BUILDING ZENODO BUNDLE {VERSION} - {BUILD_DATE}")
    print("=" * 70)

    if BUNDLE_DIR.exists():
        shutil.rmtree(BUNDLE_DIR)
    BUNDLE_DIR.mkdir(parents=True)

    copied = []
    for src_rel, dst_rel in FILES:
        src = ROOT / src_rel
        if not src.exists():
            print(f"  [MISS] {src_rel}")
            continue
        dst = BUNDLE_DIR / dst_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied.append((src_rel, dst_rel, dst))

    for src_rel, dst_rel in DIRS:
        src = ROOT / src_rel
        if not src.exists():
            print(f"  [MISS-DIR] {src_rel}")
            continue
        dst = BUNDLE_DIR / dst_rel
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=_ignore_pycache)
        n = sum(1 for _ in dst.rglob("*") if _.is_file())
        copied.append((src_rel, dst_rel + f"/  ({n} files)", dst))
        print(f"  [dir ] {src_rel} -> {dst_rel} ({n} files)")

    # Remove known-broken cleaned corpora produced from web-page dumps.
    # These files are empty/boilerplate-only and should not be shipped as
    # reproducible cleaned text. The raw 1QS transcriptions remain in corpora/raw/.
    remove_cleaned = [
        BUNDLE_DIR / "corpora/cleaned/dead_sea_scrolls_cleaned.txt",
        BUNDLE_DIR / "corpora/cleaned/nag_hammadi_cleaned.txt",
    ]
    for p in remove_cleaned:
        if p.exists():
            p.unlink()
            print(f"  [REMOVE] {p.relative_to(BUNDLE_DIR).as_posix()}")

    # --- verify the canonical SHA256SUMS against the copied bytes ----------
    print("-" * 70)
    sums_file = BUNDLE_DIR / SUMS_REL
    ok, fail = 0, 0
    for line in sums_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        digest, rel = line.split(None, 1)
        cand = BUNDLE_DIR / rel
        if not cand.exists():
            # canonical repo paths map into bundle folders
            alt = {
                "whitepaper-submission/": "whitepaper/",
                "research/pillars/pillar4_frequency_principles/outputs/": "results/",
                "research/pillars/pillar2_ai_pattern/outputs/": "results/",
                "meditation-app/outputs/": "results/",
            }
            for k, v in alt.items():
                if rel.startswith(k):
                    cand = BUNDLE_DIR / (v + rel.split("/")[-1])
                    break
        if cand.exists() and sha256(cand) == digest:
            ok += 1
            print(f"  [ OK ] {rel}")
        else:
            fail += 1
            print(f"  [FAIL] {rel}")
    if fail:
        raise SystemExit(f"ABORT: {fail} canonical checksum(s) failed to verify")

    # --- MANIFEST.txt -------------------------------------------------------
    lines = [
        "Silent Spirits Legacy - Zenodo bundle manifest",
        f"Version: {VERSION}",
        f"Built (UTC): {BUILD_DATE}",
        "Author: Aundrae Giles  (ORCID 0009-0006-4026-2891)",
        "License: MIT (code), CC BY 4.0 (data and documentation)",
        "",
        "Every file below is the exact byte content of the repository artifact.",
        "Canonical integrity registry: whitepaper/SHA256SUMS (verified at build time).",
        "",
    ]
    for p in sorted(BUNDLE_DIR.rglob("*")):
        if p.is_file() and p.name != "MANIFEST.txt":
            rel = p.relative_to(BUNDLE_DIR).as_posix()
            lines.append(f"{sha256(p)}  {rel}")
    (BUNDLE_DIR / "MANIFEST.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  [ OK ] MANIFEST.txt ({sum(1 for l in lines if '  ' in l)} files hashed)")

    # --- zip ----------------------------------------------------------------
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(BUNDLE_DIR.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(BUNDLE_DIR.parent))
    size_mb = ZIP_PATH.stat().st_size / 1e6
    print("-" * 70)
    print(f"Bundle staging dir: {BUNDLE_DIR}")
    print(f"ZIP: {ZIP_PATH}  ({size_mb:.1f} MB)")
    print(f"Canonical checksums verified: {ok}/{ok + fail}")
    print("=" * 70)


if __name__ == "__main__":
    main()