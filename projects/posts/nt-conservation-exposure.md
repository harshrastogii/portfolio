---
title: NT Conservation Exposure
seo_title: "A transparent conservation exposure index for the Northern Territory, validated against expert assessment"
dek: "A transparent, open-data conservation exposure index for the whole Territory, tested against expert biodiversity assessment of the Roper River. Agreement was weak, and it came from land convertibility, not biodiversity."
order: 13
code: RE·13
pill: Research
built_with: [Python, Hexagonal grid (EPSG:3577), Spatial statistics, Open NT data]
links:
  - { label: "Code and data on GitHub", href: "https://github.com/harshrastogii/nt-conservation-exposure" }
# rho 0.24, CI 0.05 to 0.43, p = 0.065: the README's key finding. The interval
# clears zero but the p-value does not clear 0.05, so say "weak", not
# "significant".
---

## The question

Where in the Northern Territory is biodiversity most exposed to land being converted? A conservation exposure index tries to answer that from open data, combining how significant a place is for biodiversity with how readily its land could be cleared or developed.

Most such indices are built and published without being checked. This one was built transparently across the whole Territory and then tested against an independent expert benchmark.

## How it works

- The Territory is divided into **16,229 hexagons of 86.6 km²** each, in Australian Albers.
- Each hexagon gets a biodiversity-significance score and a land-convertibility score from open NT and Australian layers, combined into one exposure score.
- Because every index involves judgement calls, the index was rebuilt **30 different ways**, varying the construction choices, to see which priorities survive.
- The result was compared with the NT Government's expert biodiversity assessment of the central Roper River catchment (Buckley et al., 2024).

## What it found

- **Agreement with expert assessment was weak**: Spearman's ρ = 0.24, with a 95% interval of 0.05 to 0.43 after correcting for spatial autocorrelation, and p = 0.065.
- **That agreement came from the convertibility side of the index, not the biodiversity side** it was built around.
- Priorities split into a **robust core of 946 hexagons** that stay high across all 30 variants, and a **construction-sensitive fringe of 860** that depend on the choices made.

The honest reading: an open-data index can flag where land is convertible, but it is not yet a reliable stand-in for expert judgement about biodiversity.

## Reproducibility

Every number in the manuscript traces to a file in the analysis outputs, regenerated from two input files with fixed random seeds. The derived inputs are shared under CC BY 4.0 with attribution to the NT Government.

## Status

The full manuscript draft is complete; references and journal formatting are pending.
