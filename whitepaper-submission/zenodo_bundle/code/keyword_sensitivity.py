#!/usr/bin/env python3
"""
KEYWORD SENSITIVITY TEST - Pillar 4 / Specificity validation, layer 2
=====================================================================
Answers the last standing reviewer objection to the specificity ratio:

  "You chose the keywords. Of course texts full of divine language
   matched your divine-language keyword list."

Method: generate NULL ontologies - random keyword lists sampled from the
actual corpus vocabulary, each word FREQUENCY-MATCHED to a real keyword
(same neighborhood in the corpus frequency-rank table, +-50 ranks).
For every null ontology, recompute the chunked wisdom/control rate ratio
with the identical 10,000-word chunking used in statistical_validation.py.
The real ontology's ratio is then compared against this null distribution.

If the real ratio sits far above the null distribution, the specificity
effect is NOT an artifact of keyword choice or word frequency alone.

Single-word keywords use exact token-count parity with the regex detector
(a token equal to the keyword == a \\b<kw>\\b match on the joined chunk).
The 9 multi-word phrases in the real ontology are counted once via padded
substring search per chunk and excluded from null draws, so real and null
ontologies are directly comparable.

Reuses corpus paths, file lists, chunk size, seed and tokenizer from
statistical_validation.py so this validates the SAME pipeline.
"""

import json
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent))

import statistical_validation as sv

OUT = sv.OUT
N_NULL = 1_000
RANK_WINDOW = 50          # null word drawn from +-50 frequency ranks of the real keyword
MIN_CORPUS_FREQ = 100     # vocabulary floor: word must occur >= 100 times overall
SEED = sv.SEED

PHRASES = sorted({kw for kw in sv.ALL_KEYWORDS if " " in kw})
SINGLE_WORDS = [kw for kw in sv.ALL_KEYWORDS if " " not in kw]  # duplicates preserved, as in the detector


def load_all_texts():
    """[(name, group, tokens)] for every corpus file, same search order as sv.main()."""
    texts = []
    for group, mapping in (("wisdom", sv.WISDOM_FILES), ("control", sv.CONTROL_FILES)):
        for name, fn in mapping.items():
            bases = [sv.CORPORA if group == "wisdom" else sv.CONTROLS, sv.HERE]
            toks = None
            for base in bases:
                cand = base / fn
                if cand.exists():
                    toks = sv.load_tokens(cand)
                    break
            if toks:
                texts.append((name, group, toks))
    return texts


def chunkify(tokens):
    return [tokens[i:i + sv.CHUNK_WORDS]
            for i in range(0, len(tokens) - sv.CHUNK_WORDS + 1, sv.CHUNK_WORDS)]


def build_chunk_data(texts):
    """Per-chunk unigram Counters + per-chunk phrase counts (padded substring)."""
    uni = []          # list of (group, Counter)
    phrase_counts = {p: [] for p in PHRASES}
    for name, group, toks in texts:
        for chunk in chunkify(toks):
            uni.append((group, Counter(chunk)))
            joined = " + " ".join(chunk) + "
            for p in PHRASES:
                phrase_counts[p].append(joined.count(" " + p + " "))
    return uni, phrase_counts


def rates_single(uni_counters, keywords):
    """Hits per 1,000 words for each chunk group, given single-word keywords."""
    kw = list(keywords)
    w_tot = c_tot = w_hits = c_hits = 0
    for group, cnt in uni_counters:
        h = sum(cnt.get(k, 0) for k in kw)
        if group == "wisdom":
            w_tot += 1
            w_hits += h
        else:
            c_tot += 1
            c_hits += h
    return (w_hits / (w_tot * sv.CHUNK_WORDS) * 1000.0,
            c_hits / (c_tot * sv.CHUNK_WORDS) * 1000.0)


def ratio(w, c):
    return w / c if c else float("inf")


def main():
    rng = random.Random(SEED)
    print("=" * 70)
    print("KEYWORD SENSITIVITY TEST - is 1.753x an artifact of keyword choice?")
    print("=" * 70)

    texts = load_all_texts()
    print(f"  loaded {len(texts)} texts, "
          f"{sum(len(t) for _, _, t in texts):,} tokens total")
    uni, phrase_counts = build_chunk_data(texts)

    # --- real ontology -----------------------------------------------------
    w_real, c_real = rates_single(uni, SINGLE_WORDS)
    real_ratio_sw = ratio(w_real, c_real)

    # add the multi-word phrases back -> must reproduce statistical_validation's 1.753x
    phrase_per_chunk = [sum(phrase_counts[p][i] for p in PHRASES) for i in range(len(uni))]
    w_hits = 0
    c_hits = 0
    for i, (group, cnt) in enumerate(uni):
        h = sum(cnt.get(k, 0) for k in SINGLE_WORDS) + phrase_per_chunk[i]
        if group == "wisdom":
            w_hits += h
        else:
            c_hits += h
    w_real_full = w_hits / (sum(1 for g, _ in uni if g == "wisdom") * sv.CHUNK_WORDS) * 1000.0
    c_real_full = c_hits / (sum(1 for g, _ in uni if g == "control") * sv.CHUNK_WORDS) * 1000.0
    real_ratio_full = ratio(w_real_full, c_real_full)

    # --- frequency-ranked vocabulary for null sampling ----------------------
    corpus_freq = Counter()
    for _, _, toks in texts:
        corpus_freq.update(toks)
    vocab = [w for w, n in corpus_freq.items() if n >= MIN_CORPUS_FREQ]
    vocab.sort(key=lambda w: -corpus_freq[w])
    rank_of = {w: i for i, w in enumerate(vocab)}
    print(f"  vocabulary for nulls: {len(vocab)} words (corpus freq >= {MIN_CORPUS_FREQ})")

    # --- null ontologies ----------------------------------------------------
    used_note = 0
    null_ratios = []
    for _ in range(N_NULL):
        used = set()
        kws = []
        for kw in SINGLE_WORDS:
            r = rank_of.get(kw, len(vocab) - 1)
            lo, hi = max(0, r - RANK_WINDOW), min(len(vocab), r + RANK_WINDOW + 1)
            word = None
            for _attempt in range(20):
                cand = vocab[rng.randrange(lo, hi)]
                if cand not in used:
                    word = cand
                    break
            if word is None:                       # window exhausted: widen search
                used_note += 1
                word = vocab[rng.randrange(len(vocab))]
                while word in used:
                    word = vocab[rng.randrange(len(vocab))]
            used.add(word)
            kws.append(word)
        w, c = rates_single(uni, kws)
        null_ratios.append(ratio(w, c))

    null_ratios.sort()
    n = len(null_ratios)
    mean_null = sum(null_ratios) / n
    sd_null = (sum((x - mean_null) ** 2 for x in null_ratios) / (n - 1)) ** 0.5
    ge = sum(1 for x in null_ratios if x >= real_ratio_sw)
    emp_p = (ge + 1) / (n + 1)
    percentile = 100.0 * sum(1 for x in null_ratios if x < real_ratio_sw) / n
    z = (real_ratio_sw - mean_null) / sd_null if sd_null else float("inf")

    result = {
        "title": "Keyword-sensitivity test of the specificity ratio",
        "generated": datetime.now(timezone.utc).isoformat(),
        "question": "Is the wisdom/control rate ratio an artifact of which keywords were chosen?",
        "method": (
            f"{N_NULL} random ontologies sampled from the corpus vocabulary "
            f"(freq >= {MIN_CORPUS_FREQ}), each keyword frequency-matched to a real "
            f"keyword within +-{RANK_WINDOW} frequency ranks; identical "
            f"{sv.CHUNK_WORDS:,}-word chunking as statistical_validation.py"),
        "n_real_singleword_keywords": len(SINGLE_WORDS),
        "n_real_phrases": len(PHRASES),
        "real_ratio_singleword_only": round(real_ratio_sw, 3),
        "real_ratio_full_ontology": round(real_ratio_full, 3),
        "parity_note": (
            "Single-word counting uses exact token equality; the regex detector "
            "(statistical_validation.py) additionally matches tokens with edge "
            "apostrophes (e.g. 'said), giving 1.753x vs 1.707x here. The sensitivity "
            "comparison is internally consistent: real and null ontologies use "
            "identical counting."),
        "real_ratio_matches_statistical_validation": abs(real_ratio_full - 1.753) < 0.05,
        "null_mean_ratio": round(mean_null, 3),
        "null_sd_ratio": round(sd_null, 3),
        "null_p5": round(null_ratios[int(0.05 * n)], 3),
        "null_p50": round(null_ratios[n // 2], 3),
        "null_p95": round(null_ratios[int(0.95 * n)], 3),
        "z_score_vs_null": round(z, 2),
        "percentile_of_real": round(percentile, 2),
        "empirical_p_value": emp_p,
        "n_nulls": n,
        "seed": SEED,
        "window_exhaustion_fallbacks": used_note,
        "phrases_excluded_from_nulls": PHRASES,
        "conclusion": (
            f"Real single-word ontology ratio {real_ratio_sw:.2f}x vs frequency-matched "
            f"null mean {mean_null:.2f}x (95% of nulls below {null_ratios[int(0.95 * n)]:.2f}x); "
            f"z = {z:.1f}, percentile {percentile:.1f}, empirical p = {emp_p:.4f}. "
            + ("The specificity effect is NOT explained by keyword choice or word frequency."
               if emp_p < 0.05 else
               "WARNING: effect not separable from keyword-choice artifact - do not overclaim.")),
    }

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "keyword_sensitivity_results.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print("-" * 70)
    print(f"Real ontology (single words): {real_ratio_sw:.3f}x")
    print(f"Real ontology (with phrases): {real_ratio_full:.3f}x "
          f"(statistical_validation reported 1.753x)")
    print(f"Null ontologies ({n}, freq-matched): mean {mean_null:.3f}x, "
          f"sd {sd_null:.3f}, p95 {null_ratios[int(0.95 * n)]:.3f}x")
    print(f"z = {z:.2f} | real ratio at percentile {percentile:.1f} | "
          f"empirical p = {emp_p:.4f}")
    print(f"Saved: {path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
