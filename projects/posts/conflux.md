---
title: Conflux
seo_title: "Conflux: air–sea anomaly detection for Northern Territory environmental data"
dek: "Weather and sea, checked together every three hours: BOM stations across the Territory and AIMS sensors off Darwin, with five detectors and a language model that reads each alarm."
order: 5
code: NT·05
pill: Research
context: PRT661
built_with: [Python, Isolation Forest, LSTM autoencoder, STL, Next.js, Cloudflare Workers, GitHub Actions]
note: "The dashboard is private until the research paper is published, so there is no link to it yet."
# The dashboard sits behind a password until the paper is published
# (conflux PR #8, agreed 16 Nov 2026). Keep the evaluation's figures
# (HadISD stations, false-alarm rates, ROC-AUC) off this page until then.
# Architecture and detectors: conflux README. Language model: PRs #10, #11.
---

## The question

Environmental monitoring in the Territory comes from separate networks that rarely meet. The Bureau of Meteorology watches the air; the Australian Institute of Marine Science watches the sea. Conflux puts them on one clock and looks for anomalies in each, and for air–sea anomalies that neither source shows on its own, using Darwin as the case study.

## How it works

Conflux runs with no always-on backend. **GitHub Actions is the backend**: every three hours a scheduled workflow collects live BOM and AIMS observations, aligns them in time, runs the detectors and commits the dashboard's processed data. A static Next.js dashboard, served by Cloudflare Workers, reads those files directly.

Five detectors look at the data in different ways:

- **Isolation Forest**, for readings that are unusual against everything else
- an **LSTM autoencoder**, for sequences it can't reconstruct
- **STL seasonal decomposition**, for departures from the daily and seasonal pattern
- a **cross-domain** detector, for air and sea disagreeing
- a **stuck-sensor** rule, for values that stop moving

Their output becomes ranked, plain-English events and a "what changed" brief. Only derived data is committed, never raw observations.

## Detectors that disagree

The design expected detectors sharing the same inputs to agree. They didn't, and the dashboard says so rather than averaging the disagreement away. Each detector's ability to find real faults was then measured against recorded sensor faults at weather stations across Australia, not just the Territory. Those results are part of a paper in preparation.

## A second opinion on every alarm

A language model reads the hours around an alarm, at the station and its nearest neighbours, and says whether it looks like a sensor fault or real weather. Its reading sits beside the fixed text, never in place of it:

- it is off unless a key is set;
- it makes at most three new calls per run, to stay inside a free limit, and reuses an explanation while its event lasts;
- any failure leaves the fixed text and never stops the pipeline.

## Status

Conflux runs live every three hours. The dashboard is private until the research paper is published, when it will be linked here.
