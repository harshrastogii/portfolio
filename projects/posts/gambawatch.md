---
title: GambaWatch NT
seo_title: "GambaWatch NT: satellite mapping of invasive gamba grass in the Top End"
dek: "A 20 m map of where gamba grass is likely across Darwin–Litchfield, from free Sentinel-1 and Sentinel-2 imagery. Tested against the NT Government's aerial weed surveys, it turned out to map gamba country, not the grass itself."
order: 4
code: NT·04
pill: Research
context: Independent research
built_with: [Google Earth Engine, Sentinel-1, Sentinel-2, MODIS, Gradient boosting, QGIS, Python]
note: "Research in progress since November 2026. The map and code aren't public yet."
# Facts: Harsh's CV (November 2026) and his LinkedIn project write-up (checked
# 26 Nov 2026). The repository is private, so there is no link.
---

## The question

Gamba grass is one of the Top End's most damaging weeds. It grows taller and denser than native grasses and fuels fires far hotter than the savanna is adapted to. Knowing where it is decides where control effort goes, but much of the country is hard to survey on foot.

GambaWatch asks whether free satellite imagery can map where gamba grass and other exotic tall grasses are likely, at 20 m, across Darwin and Litchfield.

## The data

- **Sentinel-1** radar, which sees through cloud and responds to the height and density of grass.
- **Sentinel-2** optical imagery through the dry season, plus fire-robust features that still work on burnt ground.
- **MODIS** burn dates, because gamba changes when and how country burns.
- **Labels** from the NT Government's 312,667 public weed records, NT Flora Atlas native-grass records, and random points across the landscape.

Everything is processed in Google Earth Engine.

## The model

Gradient-boosted trees on 67 seasonal radar, optical and burn-date features plus 10 fire-robust Sentinel-2 features, mapped for the 2025 dry season. It was tested with spatial cross-validation and by transferring it to two other regions, Katherine–Daly and Kakadu–West Arnhem.

## The first results

Against random land, on records the model never saw:

| Test | AUC |
|---|---|
| 5,955 treated gamba records | 0.86 |
| Gamba Eradication Register's active 1 ha cells | 0.80 |
| 19,227 aerial-survey records | 0.69 |

An independent 200-point check found all 9 points inside recorded patches scored 50% or more.

## The test that mattered

Public weed records only say where gamba was found, not where it wasn't, so they can rank a map but can't measure its accuracy. So GambaWatch went after the missing half: **27,469 recorded absences** from the NT Government's Weed Management Branch, and four aerial grid surveys flown from 2023 to 2026, covering 36,468 cells.

Within surveyed gamba country, the map barely separates cells with gamba from cells without: a pooled AUC of **0.54** at the pixel and 0.63 over a 220 m window. Only the highest scores carry signal; at 90 or above, gamba was found in 42% of cells, against 25 to 30% elsewhere.

## What it means

The earlier scores were measuring where gamba country is, not the grass itself. That is still useful for deciding where to look, but it isn't a map of the weed. The project's claims were restated to match.

The next version trains on the survey absences as hard negatives, and will be tested on whole surveys it has never seen.
