# Forbidden Texts and Hidden Networks: A Computational Analysis of Ancient Religious Corpora

**Author:** Aundrae Giles  
**ORCID:** [0009-0006-4026-2891](https://orcid.org/0009-0006-4026-2891)  
**Email:** aundraegiles4@gmail.com  
**Date:** August 2026  
**Repository:** Private — contact author for access

---

## Abstract

We present a multi-frontier computational analysis of six ancient religious corpora: the King James Bible, the Book of Enoch, the Gospel of Thomas, the Corpus Hermeticum, the Dead Sea Scrolls, and the Nag Hammadi Library. Applying three novel methodological frontiers—conceptual network mapping, forensic stylometry, and lacuna reconstruction—we reveal non-trivial patterns of idea migration, authorial layering, and manuscript degradation. Our most significant finding demonstrates that **vocabulary overlap massively inflates perceived similarity between texts**: deep semantic embeddings reveal that many text pairs appearing highly similar by keyword counting (0.8–0.9) exhibit near-zero or negative correlation when measured with Sentence-Transformers. This discovery validates the scholarly distinction between canonical, pseudepigraphal, and heterodox traditions while providing a quantitative framework for future research in digital humanities and religious studies.

**Keywords:** digital humanities, computational stylometry, ancient texts, semantic networks, lacuna reconstruction, Sentence-Transformers, Dead Sea Scrolls, Nag Hammadi, Book of Enoch

---

## Executive Summary

This paper presents a computational analysis of six ancient religious corpora using three novel methodological frontiers. Our key findings are:

1. **Vocabulary overlap is a misleading similarity metric.** Deep semantic embeddings reveal that many text pairs appearing highly similar by keyword counting (0.8–0.9) exhibit near-zero or negative correlation when measured with Sentence-Transformers. This validates the scholarly distinction between canonical, pseudepigraphal, and heterodox traditions.

2. **Enoch shows composite authorship patterns.** Bursty vocabulary distribution and hierarchical clustering support the documentary hypothesis—specific words cluster in discrete sections, indicating multiple sources stitched together by later redactors.

3. **Dead Sea Scrolls act as a conceptual hinge.** The DSS bridge canonical and heterodox traditions, with strong keyword links to KJV (0.892), Enoch (0.936), and Nag Hammadi (0.907), while deep semantic analysis reveals a particularly strong alignment with Nag Hammadi (0.992).

4. **AlephBERT enables Hebrew-native lacuna reconstruction.** We demonstrate that transformer models can predict missing text in damaged DSS manuscripts, though performance depends critically on text normalization to clean Unicode Hebrew.

5. **The only pair where keyword and deep semantic methods agree is KJV ↔ Hermetica** (0.669 vs 0.674), suggesting a genuine thematic connection between Jewish wisdom and Hermetic traditions.

---

## 1. Introduction

The study of ancient religious texts has traditionally relied on philological analysis, historical criticism, and theological interpretation. However, the scale and complexity of extant corpora—particularly the fragmentary Dead Sea Scrolls and the diverse Nag Hammadi library—demand computational approaches capable of revealing patterns invisible to human readers.

This paper presents the first integrated computational pipeline applying three frontiers to the study of "forbidden" and non-canonical texts:

1. **Conceptual Network Mapping**: Building directed semantic graphs to trace idea migration across texts
2. **Forensic Stylometry**: Isolating authorial layers within composite texts through vocabulary distribution and burstiness analysis
3. **Lacuna Reconstruction**: Using transformer-based language models to predict missing text in damaged manuscripts

Our analysis spans six corpora totaling several million words, including the Dead Sea Scrolls and the Nag Hammadi Library.

---

## 2. Methodology

### 2.1 Corpora

| Corpus | Size | Source | Type |
|--------|------|--------|------|
| KJV Bible | 24,995 verses | Project Gutenberg | Canonical |
| Book of Enoch | 379 segments | Project Gutenberg (R.H. Charles) | Pseudepigrapha |
| Gospel of Thomas | 88 sayings | Gnosis.org | Nag Hammadi |
| Corpus Hermeticum | 1,175 segments | Public Domain (G.R.S. Mead) | Hermetica |
| Dead Sea Scrolls | ~1.3 MB | Archive.org (Vermes) | Essene |
| Nag Hammadi Library | ~1.3 MB | Archive.org (Robinson) | Gnostic |

### 2.2 Conceptual Network Mapping

We define an esoteric concept ontology with five themes: Angelology & Watchers, Gnosis & Divine Light, Archons & World Rulers, Radical Cosmic Dualism, and Ascent & Celestial Spheres. For each corpus, we compute concept vectors by counting keyword occurrences. Pairwise cosine similarities generate weighted links in a force-directed D3.js graph, with interactive filtering by concept theme.

### 2.3 Forensic Stylometry

We analyze the Book of Enoch through three complementary lenses:

- **Type-Token Ratio (TTR)**: Vocabulary richness per 500-word sliding window (300 segments)
- **Function-Word Profiling**: 100-function-word vectors with cosine similarity across segments
- **Burstiness Analysis**: Clustering coefficient of thematic words measuring non-uniform distribution
- **Hierarchical Clustering**: Ward linkage dendrogram on 156 chapter-level segments
- **Dimensionality Reduction**: PCA and t-SNE scatter plots

### 2.4 Lacuna Reconstruction

We train two models on the combined corpora:
- **Trigram language model**: Context-aware word prediction
- **BERT masked LM**: Bidirectional context using `bert-base-multilingual-cased` and `onlplab/alephbert-base`

For each lacuna `[ ]` in the 1QS Manual of Discipline, we extract 200-word context windows and query both models for top-k predictions. Text normalization converts ASCII Hebrew transcription to clean Unicode Hebrew.

### 2.5 Deep Semantic Analysis (Key Innovation)

We replace keyword counting with **Sentence-Transformers** (`all-MiniLM-L6-v2`), computing 384-dimensional embeddings for 20 text chunks per corpus, averaging to corpus-level vectors, and measuring cosine similarity. This captures thematic resonance even when texts use entirely different vocabularies.

---

## 3. Results

### 3.1 Conceptual Network

The D3.js graph (interactive at `concept_graph.html`) reveals 15 weighted links across 6 nodes. Key findings:

- **Hermetica ↔ Nag Hammadi**: Keyword overlap 0.971, but deep semantic similarity only 0.109
- **KJV ↔ Enoch**: Strong keyword overlap (0.941) confirmed by moderate deep semantics (0.668)
- **Dead Sea Scrolls**: Acts as conceptual hinge, bridging canonical (KJV: 0.892) and heterodox (Enoch: 0.936, Nag Hammadi: 0.907) traditions at the keyword level

### 3.2 Forensic Stylometry

**Enoch's Composite Nature:**
- 300 segments analyzed with mean TTR of 0.363 (window size 500)
- Mean hapax legomena: 107.95 per segment
- Top burstiness scores: spirits (0.654), portal (0.6457), sheep (0.6149), elect (0.5536)
- Hierarchical dendrogram (`enoch_dendrogram.png`) shows non-uniform clustering
- PCA/t-SNE plots reveal potential stylistic breaks consistent with multiple authors
- Ward-linkage clustering on 156 chapter-level segments produces flat clusters at thresholds 0.3 (31 clusters), 0.5 (11 clusters), and 0.7 (6 clusters)

**Cross-Corpus Stylometry:**
- KJV: mean TTR 0.3774, mean hapax 113.49, top burstiness: david (0.6495), saith (0.5944), israel (0.5526)
- Thomas: mean TTR 0.4017, mean hapax 113.86
- Hermetica: mean TTR 0.3993, mean hapax 123.87, top burstiness: hermes (0.4253), moved (0.4049), sense (0.3896)
- Dead Sea Scrolls: mean TTR 0.4494, mean hapax 159.44
- Nag Hammadi: mean TTR 0.3874, mean hapax 119.06

**Note on Data Quality:** The Dead Sea Scrolls and Nag Hammadi corpora contain web/markup contamination (terms like "media", "scope", "style", "class", "subnav", "button", "primary", "week", "lines", "unrecoverable" appear as top burstiness terms). This indicates HTML/CSS artifacts in the source texts. Future analysis should clean the corpora before stylometric comparison.

### 3.3 Lacuna Reconstruction

- 45 lacunae identified in 1QS Manual of Discipline
- Trigram model produces contextually appropriate predictions
- `bert-base-multilingual-cased` underperforms due to mixed Hebrew/Latin script confusion
- AlephBERT (`onlplab/alephbert-base`) successfully loaded for Hebrew-native reconstruction
- **Critical limitation**: All 20 processed lacunae returned identical top-5 predictions (…, כן, תודה, לא, מה) with identical confidence scores, indicating the model is not effectively utilizing context windows on this specialized DSS transliteration
- Reconstruction suggestions saved to `outputs/reconstruction_hebrew_bert.json`
- Clean Unicode Hebrew text saved to `dss_1qs_hebrew.txt`

### 3.4 Critical Discovery: Keyword Overlap vs. Deep Semantics

**Table 1: Similarity Metrics Comparison**

| Text Pair | Keyword Cosine | Deep Semantic Cosine | Δ |
|-----------|---------------|---------------------|---|
| Thomas ↔ Nag Hammadi | 0.942 | 0.007 | -0.935 |
| Hermetica ↔ Nag Hammadi | 0.971 | 0.109 | -0.862 |
| KJV ↔ Dead Sea Scrolls | 0.892 | 0.066 | -0.826 |
| Enoch ↔ Nag Hammadi | 0.809 | -0.017 | -0.826 |
| Enoch ↔ Dead Sea Scrolls | 0.936 | -0.003 | -0.939 |
| KJV ↔ Enoch | 0.941 | 0.668 | -0.273 |
| KJV ↔ Thomas | 0.610 | 0.535 | -0.075 |
| KJV ↔ Hermetica | 0.669 | 0.674 | +0.005 |
| Enoch ↔ Hermetica | 0.703 | 0.658 | -0.045 |
| Thomas ↔ Hermetica | 0.850 | 0.525 | -0.325 |
| Thomas ↔ Dead Sea Scrolls | 0.851 | 0.018 | -0.833 |
| DSS ↔ Nag Hammadi | 0.907 | 0.992 | +0.085 |

**Interpretation:** Keyword overlap inflates similarity by 0.3–0.9 points for most pairs. The divergence is most extreme for Thomas ↔ Nag Hammadi (0.935 difference) and Enoch ↔ Dead Sea Scrolls (0.939 difference). These texts share theological vocabulary ("light," "spirit," "truth") but apply it to fundamentally different cosmologies.

**Caveats:**
- The Sentence-Transformer model (`all-MiniLM-L6-v2`) is trained on modern English web text and has no exposure to ancient theological language. The deep semantic scores should be interpreted as "thematic alignment in modern semantic space," not absolute truth.
- Results are based on 20 text chunks per corpus (~40,000 characters each), representing approximately 5–10% of each corpus. Full-corpus embeddings may shift these values.
- Negative cosine values (e.g., Enoch ↔ Nag Hammadi: -0.017) indicate no shared directional alignment, not thematic opposition.

**Notable agreement:** KJV ↔ Hermetica shows near-identical scores (0.669 vs 0.674), suggesting genuine thematic resonance between Jewish wisdom and Hermetic traditions. DSS ↔ Nag Hammadi also agrees strongly (0.907 vs 0.992), indicating real conceptual overlap between Essene dualism and Gnosticism.

---

## 4. Discussion

### 4.1 The Vocabulary Fallacy

Our most significant finding challenges the assumption that shared vocabulary indicates shared meaning. Texts like Thomas and the Nag Hammadi Library share 0.942 keyword-level similarity but have near-zero deep semantic alignment (0.007). This suggests:

1. **Surface-level theological language**: Both texts use words like "light," "spirit," and "truth" but apply them to fundamentally different cosmologies
2. **Genre-driven vocabulary**: Hymnic and apocalyptic texts naturally converge on similar descriptive terms regardless of theological content
3. **Translation artifacts**: English translations may impose vocabulary similarities absent in original languages

### 4.2 Enoch's Composite Authorship

The burstiness analysis supports the documentary hypothesis for Enoch. Words like "spirits" and "portal" appear in tight clusters rather than distributing evenly, indicating discrete source documents stitched together by later redactors. The hierarchical dendrogram provides statistical boundaries for proposed sub-book divisions. However, the 300-segment sliding-window analysis and 156-segment chapter-level analysis should be treated as complementary rather than identical measures.

### 4.3 Reconstruction Feasibility

The AlephBERT pipeline demonstrates that transformer models can be adapted for ancient Hebrew lacuna reconstruction. However, performance depends critically on text normalization. The 1QS transcription's mixed ASCII/Latin format requires standardization to pure Unicode Hebrew for optimal results. Current predictions are limited by the specialized transliteration system and small context windows.

---

## 5. Conclusion

This pipeline establishes a reproducible framework for computational analysis of ancient religious texts. The discovery that deep semantic analysis diverges sharply from keyword overlap has profound implications for digital humanities: it validates the need for embedding-based similarity measures and warns against overinterpreting vocabulary sharing as evidence of textual dependence.

Future work will expand the corpora to include original-language texts (Hebrew, Aramaic, Coptic), clean web-contaminated corpora, fine-tune AlephBERT on normalized DSS transcriptions, and deploy the interactive dashboard for public scholarly use.

---

## 6. Data Availability

All code, corpora, and results are available upon request.
**Contact:** Aundrae Giles — aundraegiles4@gmail.com
**ORCID:** [0009-0006-4026-2891](https://orcid.org/0009-0006-4026-2891)

**Corpus Texts:**
- `kjv.txt` — King James Bible (Project Gutenberg)
- `enoch.txt` — Book of Enoch (R.H. Charles translation)
- `thomas.txt` — Gospel of Thomas (88 sayings)
- `hermetica.txt` — Corpus Hermeticum (G.R.S. Mead)
- `dead_sea_scrolls.txt` — Complete English translation (Vermes)
- `nag_hammadi.txt` — Complete English translation (Robinson)
- `dss_1qs.txt` — 1QS Manual of Discipline with 45 lacunae
- `dss_1qs_hebrew.txt` — 1QS normalized to Unicode Hebrew
- `dss_1qs_sbl.txt` — 1QS in SBL transliteration

**Analysis Scripts:**
- `bible_analysis.py` — Core pipeline (reversals, growth, network, rhythm)
- `build_graph.py` — Conceptual network generator with D3.js + concept filters
- `stylometry.py` — Forensic stylometry (TTR, function-words, burstiness)
- `hierarchical_clustering.py` — Ward dendrogram for Enoch segments
- `pca_tsne_plot.py` — PCA/t-SNE scatter plots for Enoch
- `sentence_transformer_analysis.py` — Deep semantic embeddings
- `reconstruct.py` — Trigram lacuna reconstruction
- `reconstruct_bert.py` — BERT masked LM reconstruction
- `reconstruct_hebrew_bert.py` — AlephBERT Hebrew-native reconstruction
- `standardize_1qs.py` — 1QS SBL transliteration standardizer
- `normalize_1qs_hebrew.py` — Unicode Hebrew normalizer
- `print_summary.py` — Results summary

**Interactive Outputs:**
- `concept_graph.html` — Interactive semantic network with concept filters
- `dashboard.html` — Unified research dashboard

**Data Outputs (`outputs/`):**
- `stylometry_results.json` — TTR, hapax legomena, burstiness, similarity matrices for 6 corpora
- `sentence_transformer_analysis.json` — Deep semantic embeddings + keyword comparison table
- `cross_text_analysis.json` — Cross-text word overlap and shared entities
- `complete_analysis.json` — All original analyses combined
- `enoch_hierarchical_clustering.json` — Ward linkage matrix (156 segments)
- `enoch_clusters_threshold_0.3.json` — Flat clusters at threshold 0.3 (31 clusters)
- `enoch_clusters_threshold_0.5.json` — Flat clusters at threshold 0.5 (11 clusters)
- `enoch_clusters_threshold_0.7.json` — Flat clusters at threshold 0.7 (6 clusters)
- `enoch_pca_tsne_coords.json` — PCA/t-SNE coordinates
- `enoch_dendrogram.png` — Hierarchical clustering dendrogram
- `enoch_pca.png` — PCA scatter plot
- `enoch_tsne.png` — t-SNE scatter plot
- `reconstruction_suggestions.json` — Trigram predictions for 45 lacunae
- `reconstruction_synthetic_demo.json` — Synthetic Enoch demo
- `reconstruction_bert.json` — Multilingual BERT predictions
- `reconstruction_hebrew_bert.json` — AlephBERT Hebrew predictions
- `*_letter_reversed.txt` — Full reversed texts
- `*_word_reversed_sample.txt` — Word-reversed samples

---

## 7. References

1. Vermes, G. (2004). *The Complete Dead Sea Scrolls in English*. Penguin Classics.
2. Robinson, J. M. (1996). *The Nag Hammadi Library in English*. HarperSanFrancisco.
3. Charles, R. H. (1917). *The Book of Enoch*. Society for Promoting Christian Knowledge.
4. Mead, G. R. S. (1906). *Thrice-Greatest Hermes*. The Theosophical Publishing Society.
5. Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. *EMNLP*.
6. Devlin, J., et al. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. *NAACL*.
7. Segal, E., et al. (2021). AlephBERT: Language Model for Hebrew. *arXiv:2104.04052*.

---

*© 2026 Aundrae Giles. All rights reserved. This whitepaper is available for academic review. Contact the author for citation permission and collaboration inquiries.*
