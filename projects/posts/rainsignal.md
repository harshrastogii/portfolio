---
title: RainSignal AU
seo_title: "RainSignal AU: live rainfall observations and machine-learning predictions"
dek: "Live Bureau of Meteorology observations run through frozen rainfall models trained on 267,317 station-days. An observation and an estimate are never shown as the same thing."
order: 9
code: ML·09
pill: PRT565
context: PRT565
built_with: [Python, Frozen ML models, BOM observations, Cloudflare Workers]
links:
  - { label: "Open RainSignal", href: "https://rainsignal.harshlabs.workers.dev/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/rainsignal-au" }
# Facts: rainsignal-au README. Credit as PRT565 only (individual project).
---

## The question

What can a machine-learning model tell you about tomorrow's rain at a given town, and what can't it? RainSignal AU answers that live, station by station, for 49 Australian towns.

## Two halves, kept apart

The models were trained and evaluated on the historical weatherAUS record: **267,317 station-days from 49 towns over 18 years**. That work is finished and frozen.

RainSignal is the live layer on top of it: a collector fetches current Bureau of Meteorology observations, a daily assembler shapes them into the model's inputs, and the frozen models run against them.

The two are never mixed:

- **historical training data and trained models** are frozen, and never touched by live data;
- **live observations and current predictions** are appended, and never fed back into training.

New observations don't trigger retraining, so the measured academic result stays exactly as it was measured.

## Honesty rules the code enforces

- **Nothing is fabricated.** When the Bureau doesn't publish a value, such as wind-gust direction, it stays missing rather than being derived from something else. Gap-filling belongs to the frozen pipeline, which was fitted on the training data.
- **Nothing is clamped.** A reading outside a plausible physical range is dropped and recorded, because a clamped value looks exactly like a real one.
- **Stations are matched by ID, never by name.** Fuzzy name matching once silently mapped Uluru to a station in New South Wales, so the mapping is curated by Bureau station ID.
- **Observations and predictions are never conflated.** An observed value and a model estimate are labelled as different things.
- **Stale data is shown as stale**, not quietly served as current.

## Data

Bureau of Meteorology observation products, used with permission for research and education (© Commonwealth of Australia). Historical training data: *Rain in Australia* (Young, 2020), originally distributed with the `rattle` package.
