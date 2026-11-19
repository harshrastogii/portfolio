---
title: PYRANTIS
seo_title: "PYRANTIS: classifying and forecasting Northern Territory fire seasons"
dek: "Every 5 km of the Territory classified by when it burns, 2000 to 2025, and a forecast for 2026: 51% expected to burn, most of it after July."
order: 2
pill: Live
live: true
context: PRT565
built_with: [Python, Gradient boosting, LSTM, Google Earth Engine, NAFI, SILO]
links:
  - { label: "Open PYRANTIS", href: "https://pyrantis.harshlabs.workers.dev/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/PYRANTIS" }
cover: { src: "/assets/pyrantis-cover.webp", compact: "/assets/pyrantis-4x3-cover.webp", alt: "PYRANTIS fire-regime map of the Northern Territory" }
# Figures: PYRANTIS README, "Results", "Checks on the results" and
# "Forecast for 2026".
---

## The question

Most of the Northern Territory's savanna burns every year. What matters is *when*. Fires before the end of July are cooler and patchier, and they are the basis of savanna fire management across northern Australia. Fires after July are hotter, larger and far more damaging.

PYRANTIS classifies each 0.05° cell of the Territory, about 5 km across, for every year from 2000 to 2025, as **unburnt**, **early** (on or before 31 July) or **late** (after 31 July). That is 46,445 cells and 1,207,570 cell-years.

## The data

- **NAFI** burnt-area mapping from Charles Darwin University, at 250 m. Each pixel carries the month it burnt, which is what makes the early and late split possible. Burnt area is used rather than satellite hotspots, which record heat at the moment of overpass and miss fires between passes.
- **SILO** daily rainfall, temperature, vapour pressure deficit and radiation, interpolated from Bureau of Meteorology stations.
- **MODIS** vegetation greenness through Google Earth Engine, which measures how much grass is standing when the dry season starts.

## Two rules the model is built around

**Nothing may see the year it is predicting.** Fire-history features come from the same table as the label, so an off-by-one would let the model read the answer. Tests recompute sampled features from the raw table and scramble a year's labels to prove no feature moves.

**Everything stops at 30 April.** The fire season runs May to October, so every input is known by the end of the wet season and the model can be run in May.

## What it found

Trained on 2005 to 2019, tuned on 2020 to 2022, and scored once on 2023 to 2025:

| Model | Macro F1 | F1 on late fire | ROC-AUC |
|---|---|---|---|
| Gradient boosting | **0.684** | 0.553 | 0.862 |
| LSTM | 0.673 | 0.561 | 0.854 |
| Random forest | 0.660 | 0.468 | 0.859 |
| Same as last year (baseline) | 0.506 | 0.241 | |

The strongest predictors are not fire history. Wet-season vapour pressure deficit, greenness and rainfall rank highest: a wet growing season builds the grass, and how thirsty the air has been decides how early it cures enough to carry a fire.

Walk-forward testing cut the record at every year from 2014 to 2024: 66 tests per model. Skill barely fades with distance, from 0.617 one year ahead to 0.604 eleven years ahead.

## The 2026 forecast

Trained on every year through 2025, the model expects 51% of the Territory to burn in 2026, 14.5% before August and 36.4% after July, against a 2000 to 2025 average of 33%. The wet season behind it was the second wettest in 22 years. It can only be checked against NAFI's mapping in 2027.

## Limits

- Late fire, the class that matters most, is still the weakest at 0.553 F1.
- Every score is measured against NAFI's own mapping, not an independent record.
- A random cross-validation split would have reported 0.772; the honest time split gives 0.677 for the same model.
- The model is fitted to the Northern Territory only; transfer to other regions is untested.
