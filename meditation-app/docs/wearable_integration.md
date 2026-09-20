# Wearable Integration Design Document

## Overview

This document outlines the design for integrating wearable heart-rate and biometric data into the Silent Spirits Legacy meditation engine, enabling real-time biofeedback-driven frequency modulation.

## Goals

- Read live heart rate (BPM) and HRV from wearable devices via Bluetooth LE or Wi-Fi
- Dynamically adjust binaural beat frequencies to match user's current physiological state
- Provide post-session biometric correlation reports
- Support Apple Watch, Fitbit, Garmin, and generic Bluetooth heart-rate monitors

## Architecture

### Backend (Python)

```
meditation-app/src/engine/wearable/
  ├── __init__.py
  ├── wearable_client.py      # BLE/Wi-Fi connection manager
  ├── heart_rate_monitor.py   # HR/HRV parsing and smoothing
  ├── biofeedback_engine.py   # Maps biometrics to frequency adjustments
  └── session_logger.py       # Persists biometric + meditation telemetry
```

### Frontend (JavaScript)

```
meditation-app/src/web/wearable/
  ├── wearable-api.js         # Web Bluetooth / WebHID bridge
  ├── heart_rate-visualizer.js # Real-time heart-rate overlay
  └── biometric-report.js     # Post-session analytics chart
```

## Data Schema

### Wearable Session Event

```json
{
  "timestamp": "2026-09-19T04:00:00.000000Z",
  "session_id": "uuid",
  "wearable_device": "Apple Watch Series 9",
  "biometrics": {
    "heart_rate_bpm": 72.5,
    "hrv_rmssd": 45.2,
    "spo2_percent": 98.5,
    "skin_temp_celsius": 32.1
  },
  "meditation_state": {
    "chakra": "heart",
    "base_frequency": 639.0,
    "binaural_offset": 10.0,
    "entrainment_target": "0.1 Hz breath coherence"
  },
  "adjustments": [
    {
      "time_seconds": 30,
      "previous_freq": 639.0,
      "new_freq": 642.0,
      "trigger": "hrv_decline",
      "magnitude": 0.5
    }
  ]
}
```

## Frequency Adjustment Algorithm

1. **Baseline calibration** (first 2 minutes): Record resting HR/HRV
2. **Entrainment target**: 0.1 Hz breath coherence (6 breaths per minute)
3. **Adjustment rules**:
   - HR > 90 BPM: shift ±0.5 Hz toward calming frequencies
   - HR < 50 BPM: shift ±0.5 Hz toward activating frequencies
   - HRV < 20 ms: add 639 Hz heart-chakra carrier
   - HRV > 80 ms: maintain base frequency, deepen meditation

## Privacy

- All biometric data stays local-first
- No cloud upload without explicit opt-in
- Session logs stored in `meditation-app/outputs/biometrics/`
- SHA256-signed logs for tamper evidence

## Implementation Phases

1. **Phase 1**: Web Bluetooth heart-rate monitor integration (JS only)
2. **Phase 2**: Python BLE backend for desktop
3. **Phase 3**: Cross-device sync and long-term biometric trend analysis
4. **Phase 4**: Clinical trial-ready export (FHIR-compatible JSON)

## Dependencies

- `bleak` (Python BLE)
- `web-bluetooth` (browser API)
- `pandas` / `numpy` (biometric signal processing)
- `scipy.signal` (HRV analysis)

## Open Questions

- Apple Watch requires native iOS wrapper for continuous background HR
- Fitbit/Garmin need OAuth tokens and cloud polling; out of scope for v1
- Web Bluetooth requires HTTPS or localhost
