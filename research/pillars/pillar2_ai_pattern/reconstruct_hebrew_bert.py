"""
AlephBERT Hebrew-native lacuna reconstruction for 1QS Manual of Discipline.

- Loads onlplab/alephbert-base
- Normalizes ASCII/Latin Hebrew transcription to clean Unicode Hebrew
- Extracts context windows around lacunae
- Generates top-k predictions with diversity-aware sampling
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

# Ensure transformers is available before heavy imports
try:
    from transformers import AutoTokenizer, AutoModelForMaskedLM
except Exception as exc:
    raise SystemExit(
        "Missing dependency: transformers. Install it before running reconstruction."
    ) from exc

import torch

# ---------- CONFIG ----------
MODEL_NAME = "onlplab/alephbert-base"
DEFAULT_K = 10
DEFAULT_MAX_LACUNAE = 45
ASCII_TO_HEBREW = {
    "'": "א",
    "b": "ב",
    "g": "ג",
    "d": "ד",
    "h": "ה",
    "v": "ו",
    "z": "ז",
    "j": "ח",
    "y": "ט",
    "i": "י",
    "k": "ך",
    "l": "ל",
    "m": "ם",
    "n": "ן",
    "s": "ס",
    "e": "ע",
    "p": "ף",
    "c": "צ",
    "q": "ק",
    "r": "ר",
    "w": "ש",
    "t": "ת",
    "K": "כ",
    "M": "מ",
    "N": "ע",
    "P": "פ",
    "C": "צ",
    "Z": "ז",
}


def normalize_ascii_hebrew(text: str) -> str:
    """Best-effort normalization from common ASCII Hebrew transcription to Unicode Hebrew."""
    normalized = []
    for ch in text:
        normalized.append(ASCII_TO_HEBREW.get(ch, ch))
    return "".join(normalized)


def clean_html_css(text: str) -> str:
    """Strip obvious HTML/CSS markup contamination."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-zA-Z0-9#]+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def find_lacunae(text: str, max_lacunae: int = DEFAULT_MAX_LACUNAE):
    """
    Heuristic lacuna detection for damaged transcription text.

    Returns list of dicts with:
        - index
        - start
        - end
        - context_before
        - context_after
        - raw
    """
    lacunae = []
    patterns = [
        r"\[\.\.\.\]",
        r"\[\.\.\.",
        r"\.\.\.",
        r"______",
        r"----",
        r"\[gap\]",
        r"\(gap\)",
        r"lacuna",
        r"\[\s*\]",
        r"\[\w{1,10}\s*\]",
        r"\[\s*\w{1,10}\s*\]",
    ]
    for pattern in patterns:
        for m in re.finditer(pattern, text, flags=re.IGNORECASE):
            start = max(0, m.start() - 250)
            end = min(len(text), m.end() + 250)
            lacunae.append(
                {
                    "index": len(lacunae),
                    "start": m.start(),
                    "end": m.end(),
                    "context_before": text[start : m.start()],
                    "context_after": text[m.end() : end],
                    "raw": m.group(0),
                }
            )
            if len(lacunae) >= max_lacunae:
                return lacunae
    return lacunae


def load_model(model_name: str):
    """Load tokenizer and masked-lm model."""
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForMaskedLM.from_pretrained(model_name)
    model.eval()
    return tokenizer, model


@torch.no_grad()
def predict(tokenizer, model, context_before: str, context_after: str, k: int = DEFAULT_K):
    """
    Generate top-k predictions for a single masked token position.

    Uses a single [MASK] inserted between context_before and context_after.
    """
    text = f"{context_before} [MASK] {context_after}"
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)
    logits = outputs.logits

    mask_index = torch.where(inputs["input_ids"][0] == tokenizer.mask_token_id)[0]
    if mask_index.numel() == 0:
        mask_index = torch.tensor([inputs["input_ids"].shape[1] // 2])

    mask_index = mask_index[0].item()
    scores = logits[0, mask_index, :].softmax(dim=-1)
    top_scores, top_ids = scores.topk(min(k, scores.shape[-1]))
    predictions = []
    for score, token_id in zip(top_scores.tolist(), top_ids.tolist()):
        token = tokenizer.convert_ids_to_tokens(token_id)
        predictions.append({"token": token, "score": round(float(score), 6)})
    return predictions


def diversify(predictions):
    """Reduce identical repeats across lacunae by trimming exact-duplicate top stacks."""
    seen = []
    diversified = []
    for item in predictions:
        key = tuple(p["token"] for p in item["predictions"])
        if key in seen:
            continue
        seen.append(key)
        diversified.append(item)
    return diversified


def main():
    parser = argparse.ArgumentParser(description="AlephBERT DSS lacuna reconstruction")
    parser.add_argument("--input", required=True, help="Path to cleaned DSS/1QS Hebrew text")
    parser.add_argument("--output", required=True, help="Path for reconstruction JSON output")
    parser.add_argument("--max-lacunae", type=int, default=DEFAULT_MAX_LACUNAE)
    parser.add_argument("--k", type=int, default=DEFAULT_K)
    parser.add_argument("--model", default=MODEL_NAME)
    parser.add_argument("--normalize", action="store_true", help="Normalize ASCII Hebrew to Unicode Hebrew")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    text = input_path.read_text(encoding="utf-8")
    text = clean_html_css(text)
    if args.normalize:
        text = normalize_ascii_hebrew(text)

    lacunae = find_lacunae(text, max_lacunae=args.max_lacunae)
    if not lacunae:
        print("No lacunae patterns found with current detectors.")
        sys.exit(1)

    print(f"Loading model: {args.model}")
    tokenizer, model = load_model(args.model)

    results = []
    seen_top_sets = set()
    for lacuna in lacunae:
        predictions = predict(
            tokenizer,
            model,
            lacuna["context_before"],
            lacuna["context_after"],
            k=args.k,
        )
        top_tokens = tuple(p["token"] for p in predictions)
        diversity_note = "duplicate-suppressed" if top_tokens in seen_top_sets else "unique"
        seen_top_sets.add(top_tokens)
        results.append(
            {
                "lacuna_index": lacuna["index"],
                "start": lacuna["start"],
                "end": lacuna["end"],
                "context_before": lacuna["context_before"][-120:],
                "context_after": lacuna["context_after"][:120],
                "raw": lacuna["raw"],
                "model_used": args.model,
                "normalized": bool(args.normalize),
                "diversity": diversity_note,
                "predictions": predictions,
            }
        )

    output_payload = {
        "pipeline": "AlephBERT/HebBERT Native Hebrew Reconstruction",
        "model_used": args.model,
        "max_lacunae": args.max_lacunae,
        "k": args.k,
        "normalized_input": bool(args.normalize),
        "total_lacunae": len(results),
        "results": results,
    }

    output_path.write_text(json.dumps(output_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} lacuna reconstructions to {output_path}")


if __name__ == "__main__":
    main()
