# Silent Spirits Legacy — Evidence Index

**Canonical whitepaper:** `whitepaper-submission/WHITEPAPER.md`  
**SHA256:** `A49F23E579F287633447BB2303E2A48E844FD308B4BF81AB280FD021CE26E45B`
**Last verified:** 2026-09-23

---

## Verified Artifacts

| Claim | Artifact Path | Status | Notes |
|-------|--------------|--------|-------|
| 7 universal regenerative principles | `research/pillars/pillar4_frequency_principles/outputs/pillar4_frequency_principles.json` | **VERIFIED** | 7 principles present with names, descriptions, frequencies, and supporting passages |
| Jaccard 50.4% | `research/pillars/pillar2_ai_pattern/outputs/pillar2_full_corpora_results.json` | **VERIFIED** | Exact value `0.5037593984962406` present |
| Enoch hierarchical clustering | `bible-analysis/outputs/enoch_hierarchical_clustering.json` | **VERIFIED** | 155 linkage entries, Ward method |
| Enoch clusters 0.3 | `bible-analysis/outputs/enoch_clusters_threshold_0.3.json` | **VERIFIED** | 31 clusters |
| Enoch clusters 0.5 | `bible-analysis/outputs/enoch_clusters_threshold_0.5.json` | **VERIFIED** | 11 clusters |
| Enoch clusters 0.7 | `bible-analysis/outputs/enoch_clusters_threshold_0.7.json` | **VERIFIED** | 6 clusters |
| Enoch dendrogram | `bible-analysis/outputs/enoch_dendrogram.png` | **VERIFIED** | Present on disk |
| Enoch PCA | `bible-analysis/outputs/enoch_pca.png` | **VERIFIED** | Present on disk |
| Enoch t-SNE | `bible-analysis/outputs/enoch_tsne.png` | **VERIFIED** | Present on disk |
| Sentence-Transformer analysis | `bible-analysis/outputs/sentence_transformer_analysis.json` | **VERIFIED** | 384-dim embeddings, 6 corpora |
| Stylometry results | `bible-analysis/outputs/stylometry_results.json` | **VERIFIED** | TTR, hapax, burstiness data |
| Cross-text analysis | `bible-analysis/outputs/cross_text_analysis.json` | **VERIFIED** | Word overlap metrics |
| Reconstruction suggestions | `bible-analysis/outputs/reconstruction_suggestions.json` | **VERIFIED** | Trigram predictions for lacunae |
| AlephBERT reconstruction | `research/pillars/pillar2_ai_pattern/outputs/reconstruction_hebrew_bert.json` | **VERIFIED** | 45 lacunae reconstructed from 1QS Manual of Discipline Hebrew transcription using AlephBERT with broadened lacuna detectors; all 45 outputs are unique |
| Clean Hebrew text | `bible-analysis/dss_1qs_hebrew.txt` | **VERIFIED** | Present on disk |
| 9 chakra frequencies | `meditation-app/src/engine/binaural_beats.py` | **VERIFIED** | CHAKRA_FREQUENCIES dict lines 38-149 |
| 63-session architecture | `meditation-app/outputs/master_manifest.json` | **VERIFIED** | 9 chakras × 7 variations cataloged |
| Phase accumulation synthesis | `meditation-app/src/engine/binaural_beats.py` | **VERIFIED** | Implementation present |
| Galaxy visualization | `meditation-app/src/web/player.html` + `meditation-app/src/web/live_visuals/index.html` | **VERIFIED** | Three.js + WebGL live visuals present with 8 scenes; playback verified by serving `player.html?mode=journey` and observing live iframe load path |
| Audio reactivity | `meditation-app/src/web/player.html` | **VERIFIED** | Web Audio API AnalyserNode setup present; audio-driven visualization mode selectable in player |
| Generation timestamp | `research/pillars/pillar2_ai_pattern/outputs/pillar2_full_corpora_results.json` | **VERIFIED** | `generated` field present |
| Generation timestamp | `research/pillars/pillar4_frequency_principles/outputs/pillar4_frequency_principles.json` | **VERIFIED** | `generated` field present |
| Corpus cleaning | `research/pillars/pillar2_ai_pattern/data/cleaned/cleaning_report.json` | **VERIFIED** | Cleaning executed from `bible-analysis/` raw sources; KJV/Enoch/Thomas/Hermetica cleaned; DSS/Nag Hammadi web dumps found non-extractable and replaced with `dss_1qs.txt` for analysis |
| Specificity ratio 2.667x | `research/pillars/pillar2_ai_pattern/outputs/specificity_ratio_2.667x.json` | **VERIFIED** | Serialized computation: sacred texts 2.667x more specific than literary controls; raw aggregate counts — superseded for publication by the length-normalized re-validation (next row) |
| Statistical validation of specificity | `research/pillars/pillar4_frequency_principles/statistical_validation.py` + `outputs/statistical_validation_results.json` | **VERIFIED** | Equal 10,000-word chunks: 1.753x (95% CI 1.59–1.94); permutation p = 1.0e-4 (10,000 perms); Mann–Whitney z = 6.57, p ≈ 5e-11; Cliff's δ = +0.83 (large); Gospel of Thomas < 1 chunk (excluded); KJV = 79/128 wisdom chunks |
| Keyword-sensitivity test of specificity | `research/pillars/pillar4_frequency_principles/keyword_sensitivity.py` + `outputs/keyword_sensitivity_results.json` | **VERIFIED** | 1,000 frequency-matched random ontologies: mean 1.073x, p95 1.441x; real ontology 1.707x (single-word subset) at 99.7th percentile, z = 3.41, empirical p = 0.004 — effect not an artifact of keyword choice or word frequency |
| Wearable/heart-rate integration | `meditation-app/docs/wearable_integration.md` | **VERIFIED** | Design doc with BLE architecture, frequency adjustment algorithm, privacy model, and implementation phases |
| SHA256 timestamp proof | `whitepaper-submission/SHA256SUMS` | **VERIFIED** | 8 canonical artifact hashes computed and stored |
| Tests for research/audio/visuals | `tests/test_nlp.py`, `tests/test_audio.py`, `tests/test_visualization.py` | **VERIFIED** | 31 unittest cases covering Jaccard, TTR, specificity ratio, frequency principles, binaural generation, manifest schema, and visualization JSON structure |

---

## Canonical Source of Truth

- **Whitepaper:** `whitepaper-submission/WHITEPAPER.md`
- **Discovery narrative:** `whitepaper-submission/DISCOVERY.md`
- **Prior art record:** `whitepaper-submission/PRIOR_ART.md`
- **Evidence index:** `whitepaper-submission/EVIDENCE_INDEX.md`
- **Code:** `meditation-app/src/engine/binaural_beats.py`, `meditation-app/src/web/player.html`
- **Research outputs:** `research/pillars/**/outputs/`, `bible-analysis/outputs/`

Do not create duplicate whitepaper files. Update this index before adding new claims.
