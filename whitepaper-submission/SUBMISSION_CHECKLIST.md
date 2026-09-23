# Submission Checklist — Silent Spirits Legacy Whitepaper

**Canonical paper:** `whitepaper-submission/WHITEPAPER.md` (single source of truth — never edit bundle copies)
**Zenodo bundle:** `whitepaper-submission/zenodo_bundle_v1.zip` (6.3 MB, 10/10 canonical checksums verified at build)
**Rebuild any time:** `python whitepaper-submission/build_zenodo_bundle.py` (after any change to the paper or results)

---

## 1. Zenodo (DOI — do this first)

1. Create/login at https://zenodo.org (can use GitHub ORCID login)
2. Click **"New upload"**
3. Upload `whitepaper-submission/zenodo_bundle_v1.zip`
4. **Suggested metadata** (copy-paste ready):
   - **Title:** Forbidden Texts and Hidden Networks: A Computational Analysis of Ancient Religious Corpora and the Silent Spirits Legacy Meditation Engine
   - **Creator:** Giles, Aundrae (ORCID: 0009-0006-4026-2891)
   - **Description:** first 2 paragraphs of the whitepaper abstract
   - **Publication date:** today
   - **License:** MIT for code files, CC-BY-4.0 for data/docs (Zenodo lets you set one license per record — use CC-BY-4.0 for the bundle and note code is MIT in the description, or split into two records)
   - **Keywords:** computational theology, digital humanities, sacred texts, NLP, stylometry, Sentence-Transformers, binaural beats, chakra frequencies, open science
   - **Related identifier:** your GitHub repo URL, relation = "is supplemented by"
   - **Communities:** consider submitting to "digital-humanities" related Zenodo communities for visibility
5. Click **"Reserve DOI"** — do this BEFORE publishing so you can paste the DOI into the paper itself
6. **Important:** after reserving the DOI, add it to WHITEPAPER.md (§8 Data Availability: "Archived: Zenodo DOI: 10.5281/zenodo.XXXXXXX"), rebuild the bundle (`python whitepaper-submission/build_zenodo_bundle.py`), and re-run the checksum registry update — then publish
7. Publish → the DOI is permanent and citable. **You cannot edit the files after publishing** (only new versions) — so verify the ZIP contents first

## 2. SSRN

1. If the earlier SSRN draft is live, submit this updated version as a **revision/new version** of the same paper (keeps the original timestamp history visible)
2. Paste the Zenodo DOI into the SSRN abstract page once published — cross-linking priority records is what makes the timestamp chain airtight
3. SSRN categories: **Legal Humanities / Humanities (HDRN)** network; SSRN will ask for an abstract ≤ 400 words — use the paper's abstract trimmed to the vocabulary-overlap finding + 7 principles + engine

## 3. Pre-submission checklist

- [x] Statistical validation (§2.7): 1.753x, p < 0.001, Cliff's δ = +0.83
- [x] Keyword-sensitivity test: real ontology at 99.7th percentile of 1,000 frequency-matched nulls (p = 0.004)
- [x] Honest caveats disclosed (Thomas excluded, KJV chunk dominance, genre component ~1.07x)
- [x] SHA256SUMS verifies 10/10 against live files (re-verified at bundle build)
- [x] Reproducibility bundle: corpora + code + results + manifest (63 files, 6.3 MB)
- [ ] Zenodo account + reserved DOI + published record
- [ ] DOI added back into WHITEPAPER.md §8 + SHA256SUMS re-hashed + bundle rebuilt (one loop)
- [ ] ORCID linked on Zenodo profile before upload (auto-claims authorship)

## 4. After publishing

- Paste the Zenodo DOI into EVIDENCE_INDEX.md as a new row (**Archived bundle**) and bump "Last verified"
- Re-run `build_zenodo_bundle.py` — it verifies nothing drifted
- Keep `zenodo_bundle_v1.zip` out of the next bundle (it lives outside the bundle dir, so it is)

**Golden rule:** any time you touch WHITEPAPER.md or any canonical artifact, run
`python whitepaper-submission/build_zenodo_bundle.py` again — it refuses to build if anything is inconsistent.
