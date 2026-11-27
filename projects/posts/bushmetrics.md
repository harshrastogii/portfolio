---
title: BushMetrics
seo_title: "BushMetrics: how much of each Northern Territory bioregion is protected"
dek: "24.6% of the Territory is protected, and Traditional Owners manage or co-manage 92.6% of it. 8 of 25 bioregions meet the 30% target; the gaps run through the pastoral middle."
order: 8
code: NT·08
pill: Live
live: true
built_with: [Python, Shapely, CAPAD 2024, IBRA v7, Getis-Ord Gi*]
links:
  - { label: "Open BushMetrics", href: "https://bushmetrics.vercel.app/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/bushmetrics" }
# Version 2 figures (CAPAD 2024 on IBRA v7), from the project's README.
# Version 1 counted NT parks only and missed Indigenous Protected Areas; the
# project withdrew its figures, so this page explains the correction without
# repeating the withdrawn numbers.
---

## The question

The world has agreed to protect 30% of land by 2030. How much of each Northern Territory bioregion is protected today, who manages that protection, and which regions fall short?

## The data

- **CAPAD 2024**, the national register of protected areas, for every terrestrial protected area in the NT and who manages it. Its own governance coding is used as published; nothing is reclassified.
- **IBRA v7**, Australia's bioregions, the same framework used in published NT conservation research.

## How it works

1. Take the NT piece of each bioregion, and its full national extent, so cross-border regions are labelled with their NT share.
2. Intersect bioregions with protected areas in Australian Albers, excluding areas CAPAD marks as lying inside others, exactly as CAPAD's own totals do, so nothing is counted twice.
3. **Validate against the government's published table.** The build fails if any bioregion differs from DCCEEW's published figure by 0.1 percentage points or more. The largest difference is 0.006 points.
4. Run a hot-spot analysis (Getis-Ord Gi\*) to find where protection clusters.
5. Simplify shapes for the web only after every statistic is computed on the full geometry.

## What it found

| Who manages it | Share of the NT's protected land |
|---|---|
| Indigenous Protected Areas | 78.7% |
| National parks jointly managed with Traditional Owners | 13.9% |
| Government | 5.0% |
| Private | 2.4% |

**24.6% of the Territory is protected, and Traditional Owners manage or co-manage 92.6% of it.**

Eight of 25 bioregions meet the 30% target, led by the Central Ranges (93.8%) and the Arnhem Plateau (75.0%). The Tanami is 48.5% protected, largely through the Southern Tanami Indigenous Protected Area, the NT's largest at 101,549 km². The biggest shortfalls run through the pastoral middle of the Territory: Sturt Plateau at 0.7%, Mitchell Grass Downs at 1.8% and Davenport Murchison Ranges at 2.2%.

## Getting it wrong, then right

The first version of BushMetrics badly understated protection, for two reasons. It used the NT Government's parks layer, which leaves out Indigenous Protected Areas: most of the Territory's protected estate. And its regions carried bioregion names but not bioregion boundaries, so its results couldn't be compared with anything published.

Version 2 rebuilt everything on CAPAD and IBRA, added the validation step that fails the build on any mismatch, and withdrew the old figures.

## Limits

- Only 7 of the 25 bioregions lie entirely inside the NT. Figures describe the NT portion, and regions where the NT holds under 10% are left out of the rankings.
- CAPAD records protected areas as at 30 June 2024.
