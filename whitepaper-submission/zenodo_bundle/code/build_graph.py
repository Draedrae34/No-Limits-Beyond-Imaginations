#!/usr/bin/env python3
"""Conceptual Network Generator: semantic overlap graph across ancient corpora."""

import json
import math
import re
import os

# ---------------------------------------------------------------------------
# 1. ESOTERIC CONCEPT ONTOLOGY
# ---------------------------------------------------------------------------
ONTOLOGY = {
    "Angelology & Watchers": [
        "angel", "archangel", "watcher", "nephilim", "fallen", "azazel",
        "semyaza", "heavenly host", "cherubim", "seraphim", "rebellion"
    ],
    "Gnosis & Divine Light": [
        "gnosis", "secret", "hidden knowledge", "divine spark", "light",
        "illumination", "pneuma", "fullness", "pleroma", "ineffable", "mystery"
    ],
    "Archons & World Rulers": [
        "archon", "demiurge", "ruler", "principalities", "powers",
        "craftsman", "ignorant god", "cosmic powers", "governor", "fate"
    ],
    "Radical Cosmic Dualism": [
        "light vs darkness", "sons of light", "sons of darkness", "truth vs error",
        "spirit of truth", "spirit of perversion", "good and evil", "two spirits"
    ],
    "Ascent & Celestial Spheres": [
        "seven heavens", "firmament", "chariot", "throne", "celestial sphere",
        "ascent", "palace", "gatekeeper", "hall", "veil"
    ]
}

# ---------------------------------------------------------------------------
# 2. LOAD CORPORA FROM FILES
# ---------------------------------------------------------------------------
CORPORA_DIR = "bible-analysis"
TEXT_FILES = {
    "KJV Bible (Canonical)": os.path.join(CORPORA_DIR, "kjv.txt"),
    "Book of Enoch (Pseudepigrapha)": os.path.join(CORPORA_DIR, "enoch.txt"),
    "Gospel of Thomas (Nag Hammadi)": os.path.join(CORPORA_DIR, "thomas.txt"),
    "Corpus Hermeticum (Hermetica)": os.path.join(CORPORA_DIR, "hermetica.txt"),
}

DEAD_SEA_SCROLLS_CANDIDATES = [
    os.path.join(CORPORA_DIR, "dead_sea_scrolls.txt"),
    os.path.join(CORPORA_DIR, "dss.txt"),
    os.path.join(CORPORA_DIR, "scrolls.txt"),
]

for path in DEAD_SEA_SCROLLS_CANDIDATES:
    if os.path.exists(path):
        TEXT_FILES["Dead Sea Scrolls (Essene Dualism)"] = path
        break

NAG_HAMMADI_CANDIDATES = [
    os.path.join(CORPORA_DIR, "nag_hammadi.txt"),
    os.path.join(CORPORA_DIR, "nag_hammadi_library.txt"),
]

for path in NAG_HAMMADI_CANDIDATES:
    if os.path.exists(path):
        TEXT_FILES["Nag Hammadi Library (Gnostic)"] = path
        break

def load_text(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

CORPORA = {}
for name, path in TEXT_FILES.items():
    if os.path.exists(path):
        CORPORA[name] = load_text(path)
    else:
        print(f"[WARN] Missing corpus file: {path}")

if not CORPORA:
    raise RuntimeError("No corpora loaded. Place text files in bible-analysis/.")

# ---------------------------------------------------------------------------
# 3. SEMANTIC VECTOR ANALYSIS
# ---------------------------------------------------------------------------
def calculate_concept_vector(text):
    text_lower = text.lower()
    vector = {}
    for concept, keywords in ONTOLOGY.items():
        score = sum(len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower)) for kw in keywords)
        vector[concept] = score
    return vector

def cosine_similarity(v1, v2):
    dot_product = sum(v1[k] * v2[k] for k in v1)
    mag1 = math.sqrt(sum(v1[k] ** 2 for k in v1))
    mag2 = math.sqrt(sum(v2[k] ** 2 for k in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

print("Calculating Esoteric Concept Overlaps...")

vectors = {title: calculate_concept_vector(text) for title, text in CORPORA.items()}

print("\n--- CONCEPT WEIGHTS PER TEXT ---")
for title, vec in vectors.items():
    print(f"\n[{title}]")
    for concept, score in vec.items():
        print(f"  • {concept}: {score}")

# ---------------------------------------------------------------------------
# 4. GRAPH CONSTRUCTION
# ---------------------------------------------------------------------------
nodes = [{"id": name} for name in CORPORA.keys()]
links = []
link_concepts = {}

names = list(CORPORA.keys())
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        sim = cosine_similarity(vectors[names[i]], vectors[names[j]])
        if sim > 0.05:
            shared_concepts = []
            for concept in ONTOLOGY:
                score1 = vectors[names[i]][concept]
                score2 = vectors[names[j]][concept]
                if score1 > 0 and score2 > 0:
                    shared_concepts.append(concept)
            
            link_id = f"{names[i]}__{names[j]}"
            link_concepts[link_id] = shared_concepts
            
            links.append({
                "source": names[i],
                "target": names[j],
                "weight": round(sim, 3),
                "concepts": shared_concepts
            })

graph_json = json.dumps({
    "nodes": nodes,
    "links": links,
    "link_concepts": link_concepts
})

# ---------------------------------------------------------------------------
# 5. GENERATE INTERACTIVE HTML (D3.js)
# ---------------------------------------------------------------------------
concept_names = list(ONTOLOGY.keys())
concept_colors = {
    "Angelology & Watchers": "#ef4444",
    "Gnosis & Divine Light": "#38bdf8",
    "Archons & World Rulers": "#a855f7",
    "Radical Cosmic Dualism": "#22c55e",
    "Ascent & Celestial Spheres": "#f59e0b"
}

html_template = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Forbidden Ideas Semantic Migration Graph</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {{ background-color: #0b0d17; color: #f8fafc; font-family: sans-serif; margin: 0; overflow: hidden; }}
        #header {{ position: absolute; top: 20px; left: 20px; z-index: 10; }}
        h1 {{ margin: 0; font-size: 1.4rem; color: #38bdf8; }}
        p {{ margin-top: 4px; font-size: 0.85rem; color: #94a3b8; }}
        #filters {{ position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(11,13,23,0.9); padding: 10px; border-radius: 8px; border: 1px solid #334155; }}
        .filter-btn {{ display: block; margin: 5px 0; padding: 6px 12px; border: 1px solid #475569; background: #1e293b; color: #f8fafc; cursor: pointer; border-radius: 4px; font-size: 12px; }}
        .filter-btn:hover {{ background: #334155; }}
        .filter-btn.active {{ border-color: #38bdf8; background: #0c4a6e; }}
        svg {{ width: 100vw; height: 100vh; }}
        .link {{ stroke-opacity: 0.6; transition: stroke-opacity 0.3s; }}
        .link.hidden {{ stroke-opacity: 0.05; }}
        .node circle {{ fill: #6366f1; stroke: #38bdf8; stroke-width: 2px; transition: fill 0.3s; }}
        .node text {{ fill: #f8fafc; font-size: 12px; font-weight: bold; pointer-events: none; }}
    </style>
</head>
<body>
    <div id="header">
        <h1>Forbidden Ideas Migration Network</h1>
        <p>Directed Semantic Overlap across Non-Canonical Corpora</p>
    </div>
    <div id="filters">
        <strong style="color:#38bdf8;font-size:12px;">Filter by Concept:</strong>
        <button class="filter-btn active" data-concept="all">All Concepts</button>
        {"".join(f'<button class="filter-btn" data-concept="{c}" style="border-color:{concept_colors.get(c, "#475569")}">{c}</button>' for c in concept_names)}
    </div>
    <svg></svg>
    <script>
        const data = {graph_json};
        const conceptColors = {json.dumps(concept_colors)};
        const svg = d3.select("svg"),
              width = window.innerWidth,
              height = window.innerHeight;

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(220))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke-width", d => d.weight * 8)
            .attr("stroke", d => {{
                const concepts = d.concepts || [];
                const primary = concepts[0] || "#38bdf8";
                return conceptColors[primary] || "#38bdf8";
            }});

        const node = svg.append("g")
            .selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", 18);

        node.append("text")
            .attr("dx", 22)
            .attr("dy", ".35em")
            .text(d => d.id);

        simulation.on("tick", () => {{
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${{d.x}},${{d.y}})`);
        }});

        function dragstarted(event, d) {{
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
        }}
        function dragged(event, d) {{
            d.fx = event.x; d.fy = event.y;
        }}
        function dragended(event, d) {{
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
        }}

        // Concept filtering
        d3.selectAll(".filter-btn").on("click", function() {{
            d3.selectAll(".filter-btn").classed("active", false);
            d3.select(this).classed("active", true);
            const concept = d3.select(this).attr("data-concept");
            
            link.classed("hidden", d => {{
                if (concept === "all") return false;
                return !d.concepts || !d.concepts.includes(concept);
            }});
            
            // Adjust link opacity based on relevance
            link.attr("stroke-opacity", d => {{
                if (concept === "all") return 0.6;
                return d.concepts && d.concepts.includes(concept) ? 0.9 : 0.05;
            }});
        }});
    </script>
</body>
</html>
"""

output_path = "concept_graph.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"\n[SUCCESS] Graph generated! Open '{output_path}' in your browser.")
