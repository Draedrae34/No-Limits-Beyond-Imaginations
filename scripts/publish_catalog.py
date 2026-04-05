#!/usr/bin/env python3
"""
Auto-generate catalog metadata, owner sample log entries, and analytics events
for every design stored under `labeled_designs/`.

Run this script any time you add new mockups in the labeled_designs folders.
"""

import json
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LABELS_DIR = BASE_DIR / "labeled_designs"
CATALOG_PATH = BASE_DIR / "data" / "catalog-metadata.json"
OWNER_SAMPLES_PATH = BASE_DIR / "data" / "owner-samples.json"
ANALYTICS_PATH = BASE_DIR / "data" / "analytics-events.json"
SIZE_GUIDE_PATH = BASE_DIR / "data" / "size-guides.json"

PRICE = 62
STORY_TEMPLATE = (
    "This hoodie was born inside the No Limits Beyond Limitations lab, "
    "where every thread is coded, tested, and tuned before the Printful team "
    "brings it to life."
)
DAILY_TARGET_LOW = 5000 / 30
DAILY_TARGET_HIGH = 10000 / 30


def load_json(path, default=None):
    if not default:
        default = []
    if not path.exists():
        return default
    with open(path, "r", encoding="utf-8") as fh:
        try:
            return json.load(fh)
        except json.JSONDecodeError:
            return default


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=4, ensure_ascii=False)


def bootstrap_metadata():
    size_guide = load_json(SIZE_GUIDE_PATH, [])
    metadata = []
    entries = []

    for design_dir in sorted(LABELS_DIR.glob("*")):
        if not design_dir.is_dir():
            continue
        designs = sorted(design_dir.glob("*.png"))
        for idx, design_path in enumerate(designs, 1):
            design_name = design_path.stem
            entry_id = f"{design_dir.name}-{design_name}"
            story = (
                f"{STORY_TEMPLATE} Released from {design_dir.name.replace('_', ' ')}."
            )
            metadata.append(
                {
                    "id": entry_id,
                    "name": design_name.replace("-", " ").title(),
                    "folder": design_dir.name,
                    "path": design_path.as_posix(),
                    "price": PRICE,
                    "sizes": size_guide,
                    "story": story,
                    "ownerSample": True,
                    "printfulStatus": "pending-upload",
                    "createdAt": datetime.now(timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z"),
                }
            )
            entries.append(design_name)
    return metadata, entries


def extend_owner_samples(design_names):
    samples = load_json(OWNER_SAMPLES_PATH, [])
    seen = {item["product"] for item in samples}

    for idx, name in enumerate(design_names, 1):
        if name in seen:
            continue
        sample = {
            "id": f"sample-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{idx}",
            "product": name.replace("-", " ").title(),
            "quantity": 1,
            "shippingUrgency": "Standard",
            "desiredDate": (datetime.now(timezone.utc) + timedelta(days=7)).strftime(
                "%Y-%m-%d"
            ),
            "notes": "Owner review sample prior to drop.",
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        samples.append(sample)
        seen.add(name)

    return samples


def seed_analytics_events(design_names):
    events = []
    now = datetime.now(timezone.utc)
    sources = ["organic", "ai-recs", "voice-command", "jarvis-alert", "email"]

    for idx, name in enumerate(design_names, 1):
        # Visits
        for visit_offset in range(2):
            events.append(
                {
                    "type": "visit",
                    "design": name,
                    "timestamp": (
                        now
                        - timedelta(minutes=random.randint(5, 60 * (visit_offset + 1)))
                    )
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "sessionDuration": random.randint(180, 420),
                    "source": random.choice(sources),
                }
            )
        # Orders
        order_count = random.randint(1, 2)
        for _ in range(order_count):
            events.append(
                {
                    "type": "order",
                    "design": name,
                    "timestamp": (now - timedelta(hours=random.randint(1, 48)))
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "quantity": random.randint(1, 2),
                    "value": PRICE + random.randint(-5, 8),
                }
            )
        # Returns (rare)
        if random.random() < 0.2:
            events.append(
                {
                    "type": "return",
                    "design": name,
                    "timestamp": (now - timedelta(hours=random.randint(1, 72)))
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "value": PRICE * 0.8,
                }
            )
    return events


def main():
    metadata, names = bootstrap_metadata()
    samples = extend_owner_samples(names)
    events = seed_analytics_events(names)

    save_json(CATALOG_PATH, metadata)
    save_json(OWNER_SAMPLES_PATH, samples)
    save_json(ANALYTICS_PATH, events)

    print(f"Generated metadata for {len(metadata)} designs.")
    print(f"Appended {len(samples)} owner sample entries.")
    print(f"Seeded {len(events)} analytics events.")
    print(
        "To finalize the Printful sync, use the metadata file and upload the files manually or extend this script with your Printful store credentials."
    )


if __name__ == "__main__":
    main()
