# Silent Spirits Legacy — Master Project Guide

**Author:** Aundrae Giles  
**Last Updated:** August 26, 2026

---

## What This Project Is

Two things in one repo:

1. **Silent Spirits Legacy** — A cosmic memorial platform (public site, Vercel-deployed)
2. **Semantic Archaeology Research** — Computational analysis of ancient religious texts (your brand, your discoveries)

---

## Project Structure

```
Silent-Spirits-Legacy/
│
├── public/                    # LIVE SITE (deployed to Vercel)
│   ├── index.html            # Research brand landing page
│   ├── shop.html             # E-commerce (Printify + PayPal)
│   ├── workshop.html         # Private workshop
│   ├── message-wall.html     # Community message wall
│   ├── god-frequency.html    # Solfeggio frequency page
│   ├── brothers-remembrance.html
│   └── ...                   # Supporting CSS/JS files
│
├── whitepaper-submission/        # CANONICAL PAPER PACKAGE
│   ├── WHITEPAPER.md            # Your complete paper — submit to arXiv
│   ├── DISCOVERY.md             # Complete discovery narrative
│   ├── PRIOR_ART.md             # Timestamp and IP baseline record
│   └── EVIDENCE_INDEX.md        # Verified claim-to-file registry
│
├── bible-analysis/           # DEEP RESEARCH (PRIVATE — gitignored)
│   ├── bible_analysis.py     # Core analysis pipeline
│   ├── build_graph.py        # Conceptual network generator
│   ├── stylometry.py         # Forensic stylometry engine
│   ├── hierarchical_clustering.py
│   ├── pca_tsne_plot.py
│   ├── sentence_transformer_analysis.py
│   ├── reconstruct.py        # Trigram lacuna reconstruction
│   ├── reconstruct_bert.py   # BERT reconstruction
│   ├── reconstruct_hebrew_bert.py  # AlephBERT reconstruction
│   ├── standardize_1qs.py
│   ├── normalize_1qs_hebrew.py
│   ├── print_summary.py
│   ├── README.md
│   ├── WHITEPAPER.md
│   ├── BLUEPRINT.md
│   ├── SOCIAL_MEDIA_POSTS.md
│   ├── dashboard.html
│   ├── concept_graph.html       # Interactive semantic network (root-level)
│   │
│   ├── outputs/              # All analysis results (23 files)
│   │   ├── stylometry_results.json
│   │   ├── sentence_transformer_analysis.json
│   │   ├── cross_text_analysis.json
│   │   ├── complete_analysis.json
│   │   ├── enoch_hierarchical_clustering.json
│   │   ├── enoch_clusters_threshold_*.json
│   │   ├── enoch_pca_tsne_coords.json
│   │   ├── enoch_dendrogram.png
│   │   ├── enoch_pca.png
│   │   ├── enoch_tsne.png
│   │   ├── reconstruction_suggestions.json
│   │   ├── reconstruction_synthetic_demo.json
│   │   ├── reconstruction_bert.json
│   │   ├── reconstruction_hebrew_bert.json
│   │   ├── book_of_enoch_*_reversed.txt
│   │   ├── kjv_bible_*_reversed.txt
│   │   ├── corpus_hermeticum_*_reversed.txt
│   │   └── gospel_of_thomas_*_reversed.txt
│   │
│   └── [corpus text files]   # Raw ancient texts
│       ├── kjv.txt
│       ├── enoch.txt
│       ├── thomas.txt
│       ├── hermetica.txt
│       ├── dead_sea_scrolls.txt
│       ├── nag_hammadi.txt
│       ├── dss_1qs.txt
│       ├── dss_1qs_hebrew.txt
│       └── dss_1qs_sbl.txt
│
├── src/                      # Site source code
│   ├── lil-mystic-persona.js
│   ├── workshop-product-tools.js
│   ├── workshop-routines.js
│   ├── private/lil-mystic.js
│   └── utils/               # Auth, DB, orders, products, etc.
│
├── docs/                     # Project documentation
│   ├── ai-hybrid-architecture.md
│   ├── lil-mystic-future-android-agent.md
│   └── master_ledger.md
│
├── scripts/                  # Build/deploy scripts
├── api/                      # Serverless functions
├── migrations/               # Database migrations
├── tests/                    # Test files
├── textures/                 # Visual assets
├── utils/                    # Shared utilities
├── node_modules/             # Dependencies (gitignored)
│
├── package.json
├── vercel.json
├── .gitignore
├── .env.local                # Environment vars (gitignored)
├── server.js / server.cjs    # Dev server
└── README.md
```

---

## The 3 Research Frontiers

### Frontier 1: Conceptual Network Mapping
**File:** `research/concept-graph.html`  
**What it does:** Traces esoteric concepts (Angelology, Gnosis, Archons, Dualism, Ascent) across 6 ancient texts  
**Key finding:** Hermetica ↔ Nag Hammadi keyword overlap = 0.971, but deep semantic = 0.109

### Frontier 2: Forensic Stylometry
**Files:** `bible-analysis/stylometry.py`, `bible-analysis/hierarchical_clustering.py`  
**What it does:** Proves composite authorship through vocabulary distribution analysis  
**Key finding:** Enoch vocabulary is bursty — "spirits" (0.654), "portal" (0.646) cluster in specific sections

### Frontier 3: Lacuna Reconstruction
**Files:** `bible-analysis/reconstruct_hebrew_bert.py`  
**What it does:** Uses AlephBERT (Hebrew-native AI) to predict missing text in damaged Dead Sea Scrolls  
**Key finding:** 45 lacunae in 1QS Manual of Discipline reconstructed with Hebrew predictions

---

## The 2 Proprietary Engines

### Engine 1: Semantic Migration Graph
- Interactive D3.js network with real-time concept filtering
- Dual-layer analysis: keyword cosine + Sentence-Transformer embeddings
- 6 corpora, 15 weighted links, toggle individual motifs

### Engine 2: Sacred Geometry Chakra Visualizer
- GPU fragment shaders (GLSL) running at 60 FPS
- 7 unique sacred geometry models mapped to Solfeggio frequencies
- Real-time Web Audio FFT → shader uniform synchronization
- Root (396 Hz) through Crown (963 Hz)

---

## Your Action Plan

### Phase 1: Establish Authority (This Week)
1. Submit `whitepaper-submission/WHITEPAPER.md` to arXiv or SSRN
2. Post the social media content from `research/social-media-posts.md`
3. Deploy `public/index.html` as your landing page

### Phase 2: Build Audience (Weeks 2-4)
1. Post 3x per week using scheduled content
2. Share `concept_graph.html` as interactive proof
3. Pitch podcasts, YouTube channels, documentary makers

### Phase 3: Monetize (Month 2+)
1. Paid deep-dive reports ($50-200)
2. Online course: "How to Analyze Ancient Texts with AI" ($200-500)
3. Consulting for universities/research labs
4. License the meditation app or sacred geometry engine

---

## What's Public vs. Private

| Folder | Status | Why |
|--------|--------|-----|
| `public/` | Public | Your live website |
| `research/` | Public | Your brand, engines, findings |
| `bible-analysis/` | Private | Raw data, scripts, unpublished details |

---

## Key Files To Know

| File | Purpose |
|------|---------|
| `whitepaper-submission/WHITEPAPER.md` | Your complete paper — submit to arXiv |
| `research/blueprint.md` | Complete reproduction guide |
| `research/social-media-posts.md` | Copy-paste posts for Twitter, Reddit, LinkedIn |
| `research/concept-graph.html` | Interactive semantic network (show this to everyone) |
| `research/chakra-visualizer.html` | Sacred geometry engine (wow factor) |
| `research/meditation-app.html` | Binaural beat studio (product potential) |
| `whitepaper-submission/EVIDENCE_INDEX.md` | Verified claim-to-file registry |

---

## Contact & Brand

- **Name:** Aundrae Giles
- **Brand:** Semantic Archaeology
- **Tagline:** "I proved what nobody else could about the forbidden texts"
- **Hook:** Keyword overlap inflates similarity by 0.3-0.9 points — deep embeddings reveal the truth

---

*This document is your single source of truth. Refer to it whenever you need to remember what we built and what comes next.*
