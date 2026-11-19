---
title: Biodiversity Surrogate Validation
seo_title: "Which open-data surrogate agrees with expert biodiversity assessment? A multiverse validation in the Northern Territory"
dek: "A pre-registered, multi-catchment test of open spatial surrogates against expert assessment. Vegetation-type rarity won, but only modestly: these are screens, not substitutes."
order: 11
code: RE·11
pill: Research
built_with: [Python, GDAL, NVIS v7, NT Land Systems, DEA Fractional Cover]
links:
  - { label: "Code and data on GitHub", href: "https://github.com/harshrastogii/biodiversity-surrogate-validation" }
# Facts: biodiversity-surrogate-validation README, "What the study finds"
# (final run of 4 October 2026). Manuscript in preparation.
---

## The question

Expert biodiversity assessments are slow and expensive, so planners often reach for open spatial layers instead: vegetation rarity, land-system rarity, how convertible the land is. Do those surrogates agree with what experts conclude on the ground? And does the answer survive defensible changes to how the comparison is made?

This study compares five open-access surrogates with the Northern Territory Government's expert biodiversity-risk assessments across several catchments, and runs the comparison 30 different ways: a multiverse analysis.

## What it found

- **Vegetation-type rarity agrees best**, per polygon, in the three large assessment areas (Spearman's ρ = 0.22, 0.51 and 0.22), and best separates the highest expert classes from the rest.
- **But not everywhere.** Land-system rarity agrees better under area weighting in the Roper and at Larrimah, and better identifies the very highest class at Gunn Point and Greater Weddell.
- **Across 30 specifications**, vegetation rarity scores highest in 21 and land-system rarity in 9, but the difference between them is clearly non-zero in only one.
- A joint model transfers to each catchment with more than six polygons, but its gain over vegetation rarity alone is not distinguishable from zero.

So the surrogates are useful screens, not substitutes for expert assessment.

## Why the answer flips

The reversals have three causes:

- **Small polygons.** 76 to 85% of polygons in the two most finely mapped assessments are under 1 hectare. Removing them lifts land-system rarity at Gunn Point from ρ = 0.14 to 0.29.
- **A few rare vegetation groups** carry the vegetation signal. Without them, Gunn Point falls from ρ = 0.22 to −0.04.
- **Already-modified land.** Convertibility partly just identifies land that has already been changed.

## A data check that mattered

An earlier copy of the Roper benchmark had been cut along land-use boundaries, and made convertibility look positively related to expert risk. On the published layer, the relationship is negative. The analysis now reads the benchmark from the published layer, and the check is documented.

## Status

The manuscript is in preparation. Code is MIT-licensed, and the manuscript, figures and derived data are CC BY 4.0.
